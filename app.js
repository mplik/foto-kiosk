// app.js
const input = document.getElementById('file');
const drop = document.getElementById('drop');
const gallery = document.getElementById('gallery');
const downloadAllBtn = document.getElementById('downloadAll');

let images = []; // {file, url, name}

function addFiles(files){
  for(const f of files){
    if(!f.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(f);
    const name = f.name || `photo-${Date.now()}.jpg`;
    const item = {file: f, url, name};
    images.push(item);
    renderThumb(item);
  }
}

function renderThumb(item){
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
    URL.revokeObjectURL(item.url);
    images = images.filter(i => i !== item);
    card.remove();
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

// drag & drop
drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = '#666'; });
drop.addEventListener('dragleave', e => { drop.style.borderColor = '#aaa'; });
drop.addEventListener('drop', e => {
  e.preventDefault();
  drop.style.borderColor = '#aaa';
  addFiles(e.dataTransfer.files);
});

input.addEventListener('change', e => addFiles(e.target.files));

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