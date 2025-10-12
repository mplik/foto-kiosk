// app.js
const input = document.getElementById('file');
const drop = document.getElementById('drop');
const gallery = document.getElementById('gallery');
const downloadAllBtn = document.getElementById('downloadAll');
const newSessionBtn = document.getElementById('newSessionBtn');
const endSessionBtn = document.getElementById('endSessionBtn');
const sessionInfo = document.getElementById('sessionInfo');

let sessionId = null;

newSessionBtn.addEventListener('click', async () => {
  const res = await fetch('/api/session', { method: 'POST' });
  const data = await res.json();
  sessionId = data.sessionId;
  sessionInfo.textContent = `ID sesji: ${sessionId}`;
  endSessionBtn.disabled = false;
  showGallery();
});

endSessionBtn.addEventListener('click', async () => {
  if (!sessionId) return;
  await fetch(`/api/session/${sessionId}`, { method: 'DELETE' });
  sessionInfo.textContent = '';
  sessionId = null;
  endSessionBtn.disabled = true;
  gallery.innerHTML = '';
});

async function addFilesToSession(files) {
  if (!sessionId) {
    alert('Najpierw utwórz nową sesję!');
    return;
  }
  for (const f of files) {
    const formData = new FormData();
    formData.append('photo', f);
    formData.append('sessionId', sessionId);
    await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
  }
  showGallery();
}

async function showGallery() {
  gallery.innerHTML = '';
  if (!sessionId) return;
  const res = await fetch(`/api/photos/${sessionId}`);
  const files = await res.json();
  for (const filename of files) {
    renderSessionThumb(filename);
  }
}

function renderSessionThumb(filename) {
  const card = document.createElement('div');
  card.className = 'card';
  const img = document.createElement('img');
  img.src = `/` + sessionId + '/' + filename;
  img.className = 'thumb';
  card.appendChild(img);

  const btns = document.createElement('div');
  btns.className = 'btns';

  const dl = document.createElement('button');
  dl.textContent = 'Pobierz';
  dl.onclick = () => {
    window.open(`/api/photo/${sessionId}/${filename}`);
  };

  const printBtn = document.createElement('button');
  printBtn.textContent = 'Drukuj';
  printBtn.onclick = () => {
    const win = window.open(`/api/photo/${sessionId}/${filename}`, '_blank');
    win.focus();
    win.print();
    win.close();
  };

  const rm = document.createElement('button');
  rm.textContent = 'Usuń';
  rm.onclick = async () => {
    await fetch(`/api/photo/${sessionId}/${filename}`, { method: 'DELETE' });
    showGallery();
  };

  btns.appendChild(dl);
  btns.appendChild(printBtn);
  btns.appendChild(rm);
  card.appendChild(btns);
  gallery.appendChild(card);
}

drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = '#666'; });
drop.addEventListener('dragleave', e => { drop.style.borderColor = '#aaa'; });
drop.addEventListener('drop', e => {
  e.preventDefault();
  drop.style.borderColor = '#aaa';
  addFilesToSession(e.dataTransfer.files);
});

input.addEventListener('change', e => addFilesToSession(e.target.files));