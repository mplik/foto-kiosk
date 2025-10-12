// app.js
const input = document.getElementById('file');
const drop = document.getElementById('drop');
const gallery = document.getElementById('gallery');
const downloadAllBtn = document.getElementById('downloadAll');
const qrInput = document.getElementById('qrInput');

// QR generator
const generateQrBtn = document.getElementById('generateQrBtn');
const generatedQrContainer = document.getElementById('generatedQrContainer');

function generateUUID() {
  // Prosty generator UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

generateQrBtn.addEventListener('click', () => {
  const userId = generateUUID();
  generatedQrContainer.innerHTML = `<p>Twój identyfikator: <b>${userId}</b></p><div id="qrcode"></div>`;
  // Generowanie kodu QR
  const qrDiv = document.getElementById('qrcode');
  new QRCode(qrDiv, {
    text: userId,
    width: 200,
    height: 200
  });
});


function getSessionId() {
  return qrInput.value.trim();
}

function addFilesToSession(files) {
  const sessionId = getSessionId();
  if (!sessionId) {
    alert('Wpisz swój kod QR przed dodaniem zdjęć!');
    return;
  }
  let sessionImages = JSON.parse(localStorage.getItem('zdjecia_' + sessionId)) || [];
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(f);
    const name = f.name || `photo-${Date.now()}.jpg`;
    sessionImages.push({ name, url });
  }
  localStorage.setItem('zdjecia_' + sessionId, JSON.stringify(sessionImages));
  showGallery();
}

function showGallery() {
  gallery.innerHTML = '';
  const sessionId = getSessionId();
  if (!sessionId) {
    gallery.innerHTML = '<p>Wpisz swój kod QR, aby zobaczyć zdjęcia.</p>';
    return;
  }
  let sessionImages = JSON.parse(localStorage.getItem('zdjecia_' + sessionId)) || [];
  for (const item of sessionImages) {
    renderSessionThumb(item);
  }
}

function renderSessionThumb(item) {
  const card = document.createElement('div');
  card.className = 'card';
  const img = document.createElement('img');
  img.src = item.url;
  img.className = 'thumb';
  card.appendChild(img);

  const btns = document.createElement('div');
  btns.className = 'btns';

  const dl = document.createElement('button');
  dl.textContent = 'Pobierz';
  dl.onclick = () => downloadFile(item);

  const printBtn = document.createElement('button');
  printBtn.textContent = 'Drukuj';
  printBtn.onclick = () => {
    const win = window.open('', '_blank');
    win.document.write(`<img src="${item.url}" style="max-width:100%;display:block;margin:auto;">`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const rm = document.createElement('button');
  rm.textContent = 'Usuń';
  rm.onclick = () => {
    // Usuwanie z localStorage
    const sessionId = getSessionId();
    let sessionImages = JSON.parse(localStorage.getItem('zdjecia_' + sessionId)) || [];
    sessionImages = sessionImages.filter(i => i !== item);
    localStorage.setItem('zdjecia_' + sessionId, JSON.stringify(sessionImages));
    showGallery();
  };

  btns.appendChild(dl);
  btns.appendChild(printBtn);
  btns.appendChild(rm);
  card.appendChild(btns);
  gallery.appendChild(card);
}

function downloadFile(item){
  const a = document.createElement('a');
  a.href = item.url;
  a.download = item.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}


drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = '#666'; });
drop.addEventListener('dragleave', e => { drop.style.borderColor = '#aaa'; });
drop.addEventListener('drop', e => {
  e.preventDefault();
  drop.style.borderColor = '#aaa';
  addFilesToSession(e.dataTransfer.files);
});

input.addEventListener('change', e => addFilesToSession(e.target.files));

qrInput.addEventListener('input', showGallery);

// download all as zip
downloadAllBtn.addEventListener('click', async () => {
  if(images.length === 0) return alert('Brak zdjęć');
  const zip = new JSZip();
  const folder = zip.folder('photos');
  for(const it of images){
    // read file as arrayBuffer
    const ab = await it.file.arrayBuffer();
    folder.file(it.name, ab);
  }
  const content = await zip.generateAsync({type:'blob'});
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'photos.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});