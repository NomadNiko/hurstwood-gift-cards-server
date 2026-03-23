import puppeteer from 'puppeteer-core';
import QRCode from 'qrcode';

interface GiftCardRenderOptions {
  templateImage: string;
  code: string;
  amount: string;
  currencySymbol: string;
  codePosition: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    fontColor?: string;
    alignment?: string;
  };
  recipientName?: string;
  notes?: string;
  expirationLabel: string;
  qrUrl?: string;
  qrPosition?: { x: number; y: number; size: number };
}

async function getQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 200, margin: 1 });
}

function qrOverlayHtml(
  qrDataUrl: string,
  qr: { x: number; y: number; size: number },
): string {
  return `<div style="position:absolute;left:${qr.x}%;top:${qr.y}%;width:${qr.size}%;"><img src="${qrDataUrl}" style="width:100%;display:block" /></div>`;
}

function buildHtml(opts: GiftCardRenderOptions, qrDataUrl?: string): string {
  const cp = opts.codePosition;
  const qrHtml =
    qrDataUrl && opts.qrPosition
      ? qrOverlayHtml(qrDataUrl, opts.qrPosition)
      : '';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:800px;font-family:Arial,sans-serif;background:#fff}
.card{position:relative;width:800px}
.card>img{width:100%;display:block}
.code-overlay{position:absolute;left:${cp.x}%;top:${cp.y}%;width:${cp.width}%;height:${cp.height}%;display:flex;flex-direction:row;align-items:center;justify-content:${cp.alignment === 'left' ? 'flex-start' : cp.alignment === 'right' ? 'flex-end' : 'center'};overflow:hidden}
.code-overlay .code{font-size:${cp.fontSize || 16}px;color:${cp.fontColor || '#000'};font-weight:bold;white-space:nowrap;line-height:1.2}
.code-overlay .exp{font-size:${(cp.fontSize || 16) * 0.6}px;color:${cp.fontColor || '#000'};white-space:nowrap;line-height:1;margin-left:8px}
.details{text-align:center;padding:24px}
.details h2{font-family:monospace;font-size:28px;margin-bottom:8px;letter-spacing:2px;color:#00838f}
.details h3{font-size:24px;color:#333;margin-bottom:12px}
.details p{font-size:14px;color:#555;margin-top:8px}
.disclaimer{text-align:left;padding:16px 24px;font-size:11px;color:#666;border-top:1px solid #ddd;margin-top:12px;line-height:1.6}
.disclaimer strong{color:#333}
.disclaimer a{color:#00838f}
</style></head><body>
<div class="card">
<img src="${opts.templateImage}" />
<div class="code-overlay"><span class="code">${opts.code}</span><span class="exp">${opts.expirationLabel}</span></div>
${qrHtml}
</div>
<div class="details">
<h2>${opts.code}</h2>
<h3>${opts.currencySymbol}${opts.amount}</h3>
${opts.recipientName ? `<p>For: ${opts.recipientName}</p>` : ''}
${opts.notes ? `<p style="font-style:italic">&ldquo;${opts.notes}&rdquo;</p>` : ''}
</div>
<div class="disclaimer">
<p>All vouchers are valid for 12 months from the date of purchase.</p>
<p>Vouchers purchased online are subject to a 3.5% Transaction Fee.</p>
<p>To redeem a voucher, please make a reservation:<br/>
Website: <a href="https://www.thehurstwood.com">www.thehurstwood.com</a><br/>
Email: <a href="mailto:bookings@thehurstwood.com">bookings@thehurstwood.com</a><br/>
Phone: <a href="tel:+441825732257">+44 1825 732257</a></p>
<p><strong>THIS VOUCHER DOES NOT HAVE A CASH VALUE.</strong></p>
</div>
</body></html>`;
}

export async function generateGiftCardPdf(
  opts: GiftCardRenderOptions,
): Promise<Buffer> {
  const qrDataUrl = opts.qrUrl ? await getQrDataUrl(opts.qrUrl) : undefined;
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await page.setContent(buildHtml(opts, qrDataUrl), {
      waitUntil: 'networkidle0',
    });
    const pdf = await page.pdf({
      width: '800px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function generateGiftCardImage(
  opts: GiftCardRenderOptions,
): Promise<Buffer> {
  const qrDataUrl = opts.qrUrl ? await getQrDataUrl(opts.qrUrl) : undefined;
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    const cp = opts.codePosition;
    const qrHtml =
      qrDataUrl && opts.qrPosition
        ? qrOverlayHtml(qrDataUrl, opts.qrPosition)
        : '';
    const cardHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}body{width:800px;background:#fff}
.card{position:relative;width:800px}
.card>img{width:100%;display:block}
.overlay{position:absolute;left:${cp.x}%;top:${cp.y}%;width:${cp.width}%;height:${cp.height}%;display:flex;flex-direction:row;align-items:center;justify-content:${cp.alignment === 'left' ? 'flex-start' : cp.alignment === 'right' ? 'flex-end' : 'center'};overflow:hidden}
.overlay .code{font-size:${cp.fontSize || 16}px;color:${cp.fontColor || '#000'};font-weight:bold;white-space:nowrap;line-height:1.2}
.overlay .exp{font-size:${(cp.fontSize || 16) * 0.6}px;color:${cp.fontColor || '#000'};white-space:nowrap;line-height:1;margin-left:8px}
</style></head><body><div class="card"><img src="${opts.templateImage}" /><div class="overlay"><span class="code">${opts.code}</span><span class="exp">${opts.expirationLabel}</span></div>${qrHtml}</div></body></html>`;
    await page.setContent(cardHtml, { waitUntil: 'networkidle0' });
    const card = await page.$('.card');
    const screenshot = await card!.screenshot({ type: 'png' });
    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}
