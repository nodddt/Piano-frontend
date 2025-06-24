<template>
  <div class="container">
    <h1>接收方 (REC): 验证与解密</h1>

    <div class="status-area" :style="{ color: libraryStatusColor }">
      <p>{{ libraryStatusText }}</p>
    </div>

    <div class="section">
      <h2>1. 上传结果包 (ZIP)</h2>
      <input type="file" accept=".zip" :disabled="disabled" @change="onZipFileChange" />
    </div>

    <div class="section">
      <h2>2. REC 私钥 (解密时需要)</h2>
      <label for="privateKeyText">粘贴私钥 (Base64 PKCS#8 DER 格式):</label>
      <textarea rows="4" v-model="privateKeyText" :disabled="disabled"></textarea>
      <label for="privateKeyFile">或上传私钥文件 (.txt 或 .key):</label>
      <input type="file" accept=".txt,.key,.pem" :disabled="disabled" @change="onPrivateKeyFileChange" />
      <p class="info-text">
        如需获得解密后计算结果，请输入data_consumer的私钥。此页面已加载完成，解密时无需联网，不会将您的私钥以任何形式上传。
      </p>
    </div>

    <div class="button-group">
      <button :disabled="disabled" @click="onVerifyOnly">仅验证</button>
      <button :disabled="disabled" @click="onVerifyAndDecrypt">验证并解密</button>
    </div>

    <div class="section" v-show="showResultsArea">
      <h2>处理结果</h2>
      <button :disabled="downloadDisabled" @click="downloadCsv">下载结果 (CSV)</button>

      <div id="verificationSection">
        <h3>验证状态:</h3>
        <pre>{{ verificationStatusText }}</pre>
      </div>

      <div id="decryptionSection" v-show="showDecryptionSection">
        <h3>解密结果:</h3>
        <pre>{{ decryptedP0Text }}</pre>
        <pre>{{ finalResultFText }}</pre>
      </div>

      <div class="section" id="chartArea" v-show="showChartArea" style="height: 400px;">
        <h3>结果分布图</h3>
        <div class="chart-controls">
          <label for="binCount">图表区间数量:</label>
          <input type="number" v-model.number="binCount" min="5" max="500" style="width: 80px; display: inline-block;" />
          <button @click="renderResultsChart">重新绘制图表</button>
        </div>
        <canvas ref="resultsChart"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from "vue";

// 外部库，使用cdn或项目里安装，注意包名版本和路径
import JSZip from "jszip";
import Decimal from "decimal.js";
import Chart from "chart.js/auto";

import { bls12_381 } from "@noble/curves/bls12-381";
const nobleBLS = bls12_381;

// Web Crypto API 子集
const subtle = window.crypto.subtle;

// 常量
const ECC_CURVE_NAME = "P-256";
const HKDF_INFO_STRING_FOR_KEY_A = "aes_key_for_c_csp_and_symmetric_key_encryption";


// UI 状态
const libraryStatusText = ref("正在加载依赖库，请稍候...");
const libraryStatusColor = ref("black");

const disabled = ref(true);

const privateKeyText = ref("");
const privateKeyFileContent = ref(null);

const loadedZipObject = ref(null);

const verificationStatusText = ref("");
const decryptedP0Text = ref("");
const finalResultFText = ref("");

const showResultsArea = ref(false);
const showDecryptionSection = ref(false);
const showChartArea = ref(false);

const downloadDisabled = ref(true);

const binCount = ref(50);

const finalResultsForCsv = ref([]);
const decryptedNumericalData = ref([]);
const resultsChart = ref(null);
const resultsChartCanvas = ref(null);

// 辅助函数区 --------------------------------------------------------

function arrayBufferToHexString(buffer) {
  return new Uint8Array(buffer)
    .reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}

function base64ToArrayBuffer(base64) {
  const s = window.atob(base64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    bytes[i] = s.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importPrivateKey(pkcs8Base64) {
  try {
    const d = base64ToArrayBuffer(pkcs8Base64);
    return await subtle.importKey(
      "pkcs8",
      d,
      { name: "ECDH", namedCurve: ECC_CURVE_NAME },
      true,
      ["deriveBits"]
    );
  } catch (e) {
    throw new Error("无法导入私钥。请确保是 P-256 曲线的 Base64 PKCS#8 DER 格式。");
  }
}

async function importSpkiPublicKey(spkiBase64) {
  try {
    const d = base64ToArrayBuffer(spkiBase64);
    return await subtle.importKey(
      "spki",
      d,
      { name: "ECDH", namedCurve: ECC_CURVE_NAME },
      true,
      []
    );
  } catch (e) {
    throw new Error("无法导入 SPKI 公钥。");
  }
}

async function deriveSharedSecret(privateKey, publicKey) {
  return await subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256);
}

async function deriveAesKeyFromShared(sharedSecretBits) {
  const m = await subtle.importKey("raw", sharedSecretBits, { name: "HKDF" }, false, ["deriveKey"]);
  return await subtle.deriveKey(
    {
      name: "HKDF",
      salt: new Uint8Array(),
      info: new TextEncoder().encode(HKDF_INFO_STRING_FOR_KEY_A),
      hash: "SHA-256",
    },
    m,
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"]
  );
}

async function aesGcmDecrypt(key, nonce, ciphertext) {
  try {
    const d = await subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, ciphertext);
    return new TextDecoder().decode(d);
  } catch (e) {
    console.error("AES-GCM 解密失败:", e);
    throw new Error("AES-GCM 解密失败。");
  }
}

function modInverse(a, m) {
  const a_orig = a;
  const m_orig = m;
  a = BigInt(a);
  m = BigInt(m);
  if (m <= 1n) throw new Error("模数必须 > 1");
  const m0 = m;
  let x0 = 0n;
  let x1 = 1n;
  a = (a % m + m) % m;
  while (a > 1n) {
    if (m === 0n)
      throw new Error(`逆元不存在: ${a_orig.toString()} 和 ${m_orig.toString()} 不互质。`);
    const q = a / m;
    let t = m;
    m = a % m;
    a = t;
    t = x0;
    x0 = x1 - q * x0;
    x1 = t;
  }
  if (x1 < 0n) x1 += m0;
  return x1;
}

function powMod(b, e, m) {
  b = BigInt(b);
  e = BigInt(e);
  m = BigInt(m);
  if (m === 0n) throw new Error("powMod: 模数不能为零。");
  let r = 1n;
  b %= m;
  while (e > 0n) {
    if (e % 2n === 1n) r = (r * b) % m;
    e /= 2n;
    b = (b * b) % m;
  }
  return r;
}

function powBigInt(b, e) {
  b = BigInt(b);
  e = BigInt(e);
  if (e < 0n) throw new Error("不支持负指数。");
  if (e === 0n) return 1n;
  let r = 1n;
  while (e > 0n) {
    if (e % 2n === 1n) r *= b;
    b *= b;
    e /= 2n;
  }
  return r;
}

function createCsvContent(data) {
  if (!data || data.length === 0) return "";
  const h = Object.keys(data[0]);
  const hs = h.join(",");
  const r = data.map((i) =>
    h
      .map((k) => {
        let v = i[k] ?? "";
        v = String(v);
        if (v.includes(",")) v = `"${v.replace(/"/g, '""')}"`;
        return v;
      })
      .join(",")
  );
  return ["\uFEFF" + hs, ...r].join("\n");
}

function triggerCsvDownload(content, filename) {
  const b = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(b);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createHistogramData(numericalData, numBins) {
  if (!numericalData || numericalData.length === 0) return { labels: [], counts: [] };
  const minVal = Math.min(...numericalData);
  const maxVal = Math.max(...numericalData);
  if (minVal === maxVal) return { labels: [minVal.toFixed(2)], counts: [numericalData.length] };
  const range = maxVal - minVal;
  const binSize = range > 0 ? range / numBins : 1;
  const counts = new Array(numBins).fill(0);
  const labels = new Array(numBins)
    .fill(0)
    .map((_, i) => (minVal + i * binSize).toPrecision(4));
  for (const value of numericalData) {
    let binIndex = binSize > 0 ? Math.floor((value - minVal) / binSize) : 0;
    if (binIndex >= numBins) binIndex = numBins - 1;
    counts[binIndex]++;
  }
  return { labels, counts };
}

function renderResultsChart() {
  if (!resultsChartCanvas.value || decryptedNumericalData.value.length === 0) {
    showChartArea.value = false;
    return;
  }
  if (resultsChart.value) {
    resultsChart.value.destroy();
  }
  const { labels, counts } = createHistogramData(decryptedNumericalData.value, binCount.value);
  showChartArea.value = true;
  resultsChart.value = new Chart(resultsChartCanvas.value.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "结果频数",
          data: counts,
          fill: true,
          backgroundColor: "rgba(0, 123, 255, 0.2)",
          borderColor: "rgba(0, 123, 255, 1)",
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "频数 (Count)" } },
        x: { title: { display: true, text: "数值区间 (Value Range)" } },
      },
    },
  });
}

// === PST13 验证函数 ===
// 参数和原代码对应，内部用 nobleBLS 完成
async function performPst13Verification(
  C_g1_str,
  c_f_eval_str,
  N_public_str,
  pi_j_g1_str_list,
  W_k_g1_str,
  g2_neg_z_points_str_list,
  commitment_pk_json
) {
  const { G1, G2, pairing, fields } = nobleBLS;
  const { Fr, Fp12 } = fields;
  const { ProjectivePoint: P1 } = G1;
  const { ProjectivePoint: P2 } = G2;

  try {
    // 1. 解析所有输入
    const g1 = (s) => (s === "POINT_AT_INFINITY" ? P1.ZERO : P1.fromHex(s));
    const g2 = (s) => (s === "POINT_AT_INFINITY" ? P2.ZERO : P2.fromHex(s));
    const g1b = P1.BASE;
    const g2b = P2.BASE;

    const C_point = g1(C_g1_str);
    const W_k_point = g1(W_k_g1_str);
    const pi_points = pi_j_g1_str_list.map(g1);
    const g2_neg_z_points = g2_neg_z_points_str_list.map(g2);
    const g2_alpha_points = commitment_pk_json.g2_alpha_j_terms_str.map(g2);

    // 获取曲线阶
    const curve_order_n = Fr.ORDER;

    const c_f_scalar = Fr.create(BigInt(c_f_eval_str));
    const N_bigint = BigInt(N_public_str);
    const N_mod_n_bigint = N_bigint % curve_order_n;

    // 重建 g^y' = g^(C_F + k*N)
    const g_c_f = g1b.multiply(c_f_scalar);
    const g_k_N = W_k_point.multiply(N_mod_n_bigint);
    const g_y_target = g_c_f.add(g_k_N);

    // LHS
    const C_adjusted = C_point.subtract(g_y_target);
    const lhs = pairing(C_adjusted, g2b);

    // RHS
    let rhs = Fp12.ONE;
    for (let j = 0; j < pi_points.length; j++) {
      if (pi_points[j].equals(P1.ZERO)) continue;
      const alpha_j_minus_z_j_g2 = g2_alpha_points[j].add(g2_neg_z_points[j]);
      if (alpha_j_minus_z_j_g2.equals(P2.ZERO)) continue;
      rhs = Fp12.mul(rhs, pairing(pi_points[j], alpha_j_minus_z_j_g2));
    }

    return Fp12.eql(lhs, rhs);
  } catch (err) {
    console.error("PST13 验证出错:", err);
    throw new Error(`PST13 验证失败: ${err.message}`);
  }
}

// === ZIP 相关的验证逻辑 ===
        async function runVerification(zip) {
            // --- MODIFICATION: 增加一个更健壮的文件读取辅助函数 ---
            const getFileContent = async (filePath, type = 'json') => {
                const file = zip.file(filePath);
                if (!file) {
                    // 提供清晰的错误信息
                    throw new Error(`文件在ZIP包中未找到: '${filePath}'。请检查ZIP文件的目录结构是否正确。`);
                }
                if (type === 'json') return JSON.parse(await file.async('string'));
                if (type === 'arraybuffer') return await file.async('arraybuffer');
                return await file.async('string');
            };

            // 加载根目录下的通用文件
            const commitment_pk = await getFileContent('commitment_pk.json');
            const n_and_r_data = await getFileContent('rsa_modulus_N.json');
            const N_public_str = n_and_r_data.N_str;

            const rowFolders = new Set();
            zip.forEach((relativePath) => {
                if (relativePath.includes('/') && !relativePath.endsWith('/')) {
                    const folderName = relativePath.split('/')[0];
                    if (folderName.startsWith('row_')) rowFolders.add(folderName);
                }
            });
            const sortedRowFolders = Array.from(rowFolders).sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]));
            if (sortedRowFolders.length === 0) throw new Error("ZIP 包中未找到任何 'row_...' 格式的子目录。");

            let verificationResults = [];
            for (const rowFolder of sortedRowFolders) {
                let status = '失败';
                let message = '';
                try {
                    // Helper to get files from the specific row folder
                    const getFileContentForRow = async (filename, type = 'json') => {
                        const fullPath = `${rowFolder}/${filename}`;
                        const file = zip.file(fullPath);
                        if (!file) throw new Error(`文件在ZIP的 ${rowFolder} 目录中未找到: ${filename}`);
                        if (type === 'json') return JSON.parse(await file.async('string'));
                        if (type === 'arraybuffer') return await file.async('arraybuffer');
                        return await file.async('string');
                    };

                    // Load all necessary data for verification for the current row
                    const commitment_c = await getFileContentForRow("commitment_c.json");
                    const proof_data = await getFileContentForRow("evaluation_proof.json");
                    const c_f_buffer = await getFileContentForRow("result_c_f.dat", "arraybuffer");
                    const c_f_eval_str = BigInt('0x' + arrayBufferToHexString(c_f_buffer)).toString();

                    const isVerified = await performPst13Verification(
                        commitment_c.commitment_C_point_g1_str,
                        c_f_eval_str,
                        N_public_str,
                        proof_data.witness_pi_j_points_g1_str,
                        proof_data.witness_W_k_point_g1_str,
                        commitment_c.g2_neg_ci_points_str,
                        commitment_pk
                    );

                    status = isVerified ? '成功' : '失败';
                    message = isVerified ? 'ZKP 验证通过' : 'ZKP 验证未通过';

                } catch (err) {
                    console.error(`处理 ${rowFolder} 验证时出错:`, err);
                    message = `验证出错: ${err.message}`;
                }
                verificationResults.push({ row: rowFolder, status, message });
            }
            return verificationResults;
        }

// === 解密流程 ===
async function runDecryption(zip, recPrivateKey) {
            const getFile = async (filename, type='json') => {
                 const file = zip.file(filename);
                 if (!file) throw new Error(`公共文件在ZIP根目录未找到: ${filename}`);
                 return type === 'json' ? JSON.parse(await file.async('string')) : await file.async(type);
            };

            const n_and_r_data = await getFile('rsa_modulus_N.json');
            const r_int = BigInt('0x' + arrayBufferToHexString(base64ToArrayBuffer(n_and_r_data.uniform_r_b64)));
            
            const c_csp_encrypted_data = await getFile('c_csp.json');
            const sk_f_rec_enc_data = await getFile('sk_f_rec_enc.json');
            const senEphemeralPkB64 = c_csp_encrypted_data.sen_ephemeral_public_key_spki_b64;

            const senEphemeralPublicKey = await importSpkiPublicKey(senEphemeralPkB64);
            const sharedSecretBits = await deriveSharedSecret(recPrivateKey, senEphemeralPublicKey);
            const key_A = await deriveAesKeyFromShared(sharedSecretBits);
            const iv_for_key_b = base64ToArrayBuffer(sk_f_rec_enc_data.nonce_b64);
            const ciphertext_for_key_b = base64ToArrayBuffer(sk_f_rec_enc_data.ciphertext_b64);
            const decrypted_key_B_buffer = await subtle.decrypt({ name: 'AES-GCM', iv: iv_for_key_b }, key_A, ciphertext_for_key_b);
            const key_B = await subtle.importKey('raw', decrypted_key_B_buffer, { name: 'AES-GCM' }, false, ['decrypt']);
            
            const csp_iv = base64ToArrayBuffer(c_csp_encrypted_data.nonce_b64);
            const csp_ciphertext = base64ToArrayBuffer(c_csp_encrypted_data.ciphertext_b64);
            const p0_content_str = await aesGcmDecrypt(key_B, csp_iv, csp_ciphertext);
            const p0_bigint = BigInt(JSON.parse(p0_content_str).p0_str);
            if (!p0_bigint) throw new Error("未能从解密的 C_CSP 内容中解析出 p0。");
            
            const rowFolders = new Set();
            zip.forEach((relativePath) => {
                if (relativePath.includes('/') && !relativePath.endsWith('/')) {
                    const folderName = relativePath.split('/')[0];
                    if (folderName.startsWith('row_')) rowFolders.add(folderName);
                }
            });
            const sortedRowFolders = Array.from(rowFolders).sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]));

            let finalResults = [];
            for (const rowFolder of sortedRowFolders) {
                let result = '';
                try {
                    const getFileContentForRow = async (filename, type='string') => {
                        const fullPath = `${rowFolder}/${filename}`;
                        const file = zip.file(fullPath);
                        if (!file) throw new Error(`文件在ZIP的 ${rowFolder} 目录中未找到: ${filename}`);
                        return type === 'json' ? JSON.parse(await file.async('string')) : await file.async(type);
                    };

                    const metadata = await getFileContentForRow("result_metadata.json", 'json');
                    const C_F_bigint = BigInt('0x' + arrayBufferToHexString(await getFileContentForRow("result_c_f.dat", "arraybuffer")));
                    
                    const degree_F_bigint = BigInt(metadata.degree_F);
                    const r_inv_mod_p0 = modInverse(r_int, p0_bigint);
                    const r_correction_term = powMod(r_inv_mod_p0, degree_F_bigint, p0_bigint);
                    const final_F_scaled_bigint = (C_F_bigint * r_correction_term) % p0_bigint;
                    
                    const scaling_factor_S = BigInt(metadata.scaling_factor_S);
                    const total_degree_plus_one = degree_F_bigint + 1n;
                    const divisor = powBigInt(scaling_factor_S, total_degree_plus_one);
                    
                    const final_actual_value_decimal = new Decimal(final_F_scaled_bigint.toString()).dividedBy(new Decimal(divisor.toString()));
                    result = final_actual_value_decimal.toFixed();
                } catch(err) {
                    result = `计算失败: ${err.message}`;
                }
                finalResults.push({ row: rowFolder, result: result });
            }
            return { p0: p0_bigint, results: finalResults };
        }


// === 事件处理 ===

async function onZipFileChange(e) {
  if (!e.target.files.length) return;
  const file = e.target.files[0];
  try {
    loadedZipObject.value = await JSZip.loadAsync(file);
    showResultsArea.value = false;
    showDecryptionSection.value = false;
    showChartArea.value = false;
    verificationStatusText.value = "";
    decryptedP0Text.value = "";
    finalResultFText.value = "";
    finalResultsForCsv.value = [];
    decryptedNumericalData.value = [];
    downloadDisabled.value = true;
    disabled.value = false;
  } catch (e) {
    alert("ZIP文件读取失败：" + e.message);
    loadedZipObject.value = null;
    disabled.value = true;
  }
}

async function onPrivateKeyFileChange(e) {
  if (!e.target.files.length) return;
  const file = e.target.files[0];
  const text = await file.text();
  privateKeyText.value = text.trim();
}

async function onVerifyOnly() {
  if (!loadedZipObject.value) {
    alert("请先选择一个ZIP文件。");
    return;
  }
  try {
    disabled.value = true;
    showResultsArea.value = true;
    showDecryptionSection.value = false;
    showChartArea.value = false;
    verificationStatusText.value = "正在验证，请勿刷新页面...";
    await nextTick();

    const verificationResults = await runVerification(loadedZipObject.value);

    verificationStatusText.value = verificationResults
      .map((r) => `${r.row}: ${r.status} - ${r.message}`)
      .join("\n");

    finalResultsForCsv.value = verificationResults.map((v) => ({
      Row: v.row,
      Verification_Status: v.status,
      Verification_Message: v.message,
      Final_Result: "N/A (私钥未提供)",
    }));

    decryptedNumericalData.value = [];
    downloadDisabled.value = false;
  } catch (e) {
    verificationStatusText.value = "验证失败：" + e.message;
  } finally {
    disabled.value = false;
  }
}

async function onVerifyAndDecrypt() {
  if (!loadedZipObject.value) {
    alert("请先选择一个ZIP文件。");
    return;
  }
  if (!privateKeyText.value.trim()) {
    alert("请提供REC私钥以进行解密。");
    return;
  }
  try {
    disabled.value = true;
    showResultsArea.value = true;
    showDecryptionSection.value = false;
    showChartArea.value = false;
    verificationStatusText.value = "正在验证，请勿刷新页面...";
    await nextTick();

    const verificationResults = await runVerification(loadedZipObject.value);

    verificationStatusText.value = verificationResults
      .map((r) => `${r.row}: ${r.status} - ${r.message}`)
      .join("\n");

    showDecryptionSection.value = true;
    decryptedP0Text.value = "正在解密，请稍候...";
    finalResultFText.value = "";
    downloadDisabled.value = true;

    const recPrivateKey = await importPrivateKey(privateKeyText.value.trim());

    const decryptData = await runDecryption(loadedZipObject.value, recPrivateKey);

    decryptedP0Text.value = `解密得到 p_0 = ${decryptData.p0.toString()}`;
    finalResultFText.value = JSON.stringify(decryptData.results, null, 2);

    // 准备CSV和图表数据
    const verificationMap = new Map(verificationResults.map((item) => [item.row, item]));
    finalResultsForCsv.value = decryptData.results.map((d) => {
      const v = verificationMap.get(d.row) ?? { status: "未知", message: "" };
      return {
        Row: d.row,
        Verification_Status: v.status,
        Verification_Message: v.message,
        Final_Result: d.result,
      };
    });

    decryptedNumericalData.value = finalResultsForCsv.value
      .map((item) => parseFloat(item.Final_Result))
      .filter((v) => !isNaN(v));

    downloadDisabled.value = false;
    await nextTick();
    renderResultsChart();
  } catch (e) {
    verificationStatusText.value = "解密失败：" + e.message;
    showDecryptionSection.value = false;
  } finally {
    disabled.value = false;
  }
}

function downloadCsv() {
  if (finalResultsForCsv.value.length === 0) {
    alert("无可下载结果。");
    return;
  }
  const csvContent = createCsvContent(finalResultsForCsv.value);
  triggerCsvDownload(csvContent, "decryption_results.csv");
}

// --- 页面初始化检测依赖 ---
onMounted(() => {
  try {
    if (
      typeof JSZip === "undefined" ||
      typeof Decimal === "undefined" ||
      !nobleBLS?.G1?.ProjectivePoint?.BASE ||
      typeof Chart === "undefined"
    ) {
      throw new Error("一个或多个依赖库未能加载。");
    }
    // 验证 nobleBLS是否可用
    nobleBLS.G1.ProjectivePoint.BASE.assertValidity();
    libraryStatusText.value = "依赖库加载成功，离线操作即可。";
    libraryStatusColor.value = "green";
    disabled.value = false;
  } catch (e) {
    libraryStatusText.value = `错误: ${e.message} 请检查网络和控制台。`;
    libraryStatusColor.value = "red";
    disabled.value = true;
  }
});
</script>

<style scoped>
body, html {
  background-color: #FFFDEC;
  margin: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #4a4a4a;
}

.container {
  max-width: 800px;
  margin: 30px auto 60px;
  padding: 0 20px;
}

h1 {
  font-weight: 700;
  font-size: 2.2rem;
  color: #6970b5;
  margin-bottom: 30px;
  text-align: center;
}

.status-area {
  font-weight: 600;
  font-size: 1.1rem;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 25px;
  user-select: none;
  text-align: center;
  box-shadow: 0 0 8px rgba(105, 112, 181, 0.3);
  background-color: #fff8d6; /* 默认淡黄 */
  color: #6a6500;
}
.status-area[style*="green"] {
  background-color: #e5f0ff;
  color: #2c4486;
}
.status-area[style*="red"] {
  background-color: #ffd6d6;
  color: #a32d2d;
}

.section {
  margin-bottom: 30px;
  padding: 20px 25px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(105, 112, 181, 0.15);
  transition: box-shadow 0.3s ease;
}
.section:hover {
  box-shadow: 0 6px 18px rgba(105, 112, 181, 0.25);
}

textarea {
  width: 100%;
  font-family: monospace;
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1.5px solid #6970b5;
  border-radius: 8px;
  background-color: #fff8f8;
  color: #4a4a4a;
  resize: vertical;
  transition: border-color 0.3s ease;
}
textarea:focus {
  outline: none;
  border-color: #505b9a;
  background-color: #fffdfc;
}

input[type="file"] {
  margin-top: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  border-radius: 6px;
  padding: 6px 10px;
  background-color: #fff8f8;
  border: 1.2px solid #6970b5;
  color: #505b9a;
  transition: border-color 0.3s ease;
}
input[type="file"]:hover:not(:disabled) {
  border-color: #505b9a;
}

label {
  font-weight: 600;
  color: #505b9a;
  display: block;
  margin-top: 10px;
  margin-bottom: 4px;
}

.info-text {
  font-size: 12px;
  color: #9e7f7f;
  margin-top: 8px;
  font-style: italic;
}

.button-group {
  margin-bottom: 30px;
  text-align: center;
}
.button-group button {
  margin: 0 12px;
  padding: 10px 28px;
  font-size: 16px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  color: #fff;
  background-color: #6970b5;
  box-shadow: 0 4px 12px rgba(105, 112, 181, 0.4);
}
.button-group button:hover:not(:disabled) {
  background-color: #505b9a;
}
.button-group button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

#verificationSection,
#decryptionSection {
  margin-top: 20px;
  background: #FFE2E2;
  padding: 15px 20px;
  border-radius: 12px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  color: #4a4a4a;
  box-shadow: inset 0 0 6px rgba(255, 226, 226, 0.8);
}

.chart-controls {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-controls label {
  font-weight: 600;
  color: #6970b5;
}

.number-input {
  width: 80px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1.5px solid #6970b5;
  color: #505b9a;
  background-color: #fff8f8;
  transition: border-color 0.3s ease;
}
.number-input:focus {
  outline: none;
  border-color: #505b9a;
  background-color: #fffdfc;
}

.chart-controls button {
  padding: 8px 20px;
  border-radius: 20px;
  border: none;
  background-color: #6970b5;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.chart-controls button:hover {
  background-color: #505b9a;
}

.chart-canvas {
  width: 100% !important;
  height: 100% !important;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(105, 112, 181, 0.2);
  background: white;
}

</style>
