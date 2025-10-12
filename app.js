// app.js
const input = document.getElementById('file');
const drop = document.getElementById('drop');
const gallery = document.getElementById('gallery');
const downloadAllBtn = document.getElementById('downloadAll');
const sessionInput = document.getElementById('sessionId');
const endSessionBtn = document.getElementById('endSessionBtn');

function getSessionKey() {
  const sessionId = sessionInput.value.trim();
  return sessionId ? `zdjecia_${sessionId}` : null;
}

function addFiles(files) {
  const key = getSessionKey();
  if (!key) {
    alert('Wpisz identyfikator sesji!');
    return;
  }
  let images = JSON.parse(localStorage.getItem(key)) || [];
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    const reader = new FileReader();
    reader.onload = function(e) {
      images.push({ name: f.name, url: e.target.result });
      localStorage.setItem(key, JSON.stringify(images));
      showGallery();
    };
    reader.readAsDataURL(f);
  }
}

function showGallery() {
  const key = getSessionKey();
  gallery.innerHTML = '';
  if (!key) {
    gallery.innerHTML = '<p>Wpisz identyfikator sesji, aby zobaczyć zdjęcia.</p>';
    return;
  }
  let images = JSON.parse(localStorage.getItem(key)) || [];
  for (const item of images) {
    renderThumb(item, key);
  }
}

function renderThumb(item, key) {
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
    let images = JSON.parse(localStorage.getItem(key)) || [];
    images = images.filter(i => i !== item);
    localStorage.setItem(key, JSON.stringify(images));
    showGallery();
  };

  btns.appendChild(dl);
  btns.appendChild(printBtn);
  btns.appendChild(rm);
  card.appendChild(btns);
  gallery.appendChild(card);
}

function downloadFile(item) {
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
  addFiles(e.dataTransfer.files);
});

input.addEventListener('change', e => addFiles(e.target.files));

sessionInput.addEventListener('input', showGallery);

endSessionBtn.addEventListener('click', () => {
  const key = getSessionKey();
  if (key) {
    localStorage.removeItem(key);
    showGallery();
  }
});

// download all as zip
downloadAllBtn.addEventListener('click', async () => {
  const key = getSessionKey();
  let images = key ? JSON.parse(localStorage.getItem(key)) || [] : [];
  if(images.length === 0) return alert('Brak zdjęć');
  const zip = new JSZip();
  const folder = zip.folder('photos');
  for(const it of images){
    const response = await fetch(it.url);
    const blob = await response.blob();
    folder.file(it.name, blob);
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