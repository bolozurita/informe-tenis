// Sincroniza los informes con Cloud Firestore cuando firebase-config.js tiene datos.
// Cada cuenta de Google guarda todo en un documento: academias/{uid}.
import { firebaseConfig } from './firebase-config.js';

const box = document.getElementById('cloud');
const V = '10.12.2', base = `https://www.gstatic.com/firebasejs/${V}/`;
const hhmm = () => new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

function status(text, kind) {
  const dot = box.querySelector('.dot'), t = box.querySelector('.st');
  if (dot) dot.className = 'dot ' + (kind || '');
  if (t) t.textContent = text;
  const saved = document.getElementById('saved');
  if (saved && window.cloud && window.cloud.on) saved.textContent = text;
}
function errText(e) {
  const c = (e && e.code) || '';
  if (c.includes('permission-denied')) return 'Sin permiso: revisa las reglas de Firestore';
  if (c.includes('unauthorized-domain')) return 'Dominio no autorizado en Firebase';
  if (c.includes('popup')) return 'Inicio de sesión cancelado';
  if (c.includes('unavailable')) return 'Sin conexión: se reintentará';
  return 'Error de nube: ' + (c || (e && e.message) || 'desconocido');
}

if (firebaseConfig && firebaseConfig.apiKey) {
  box.hidden = false;
  box.innerHTML = '<span class="dot busy"></span><span class="st">Conectando…</span>';
  try {
    const [{ initializeApp }, A, F] = await Promise.all([
      import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')
    ]);
    const fb = initializeApp(firebaseConfig);
    const auth = A.getAuth(fb), db = F.getFirestore(fb);
    let user = null, ref = null, timer = null, unsub = null;
    const sent = new Set();

    async function push() {
      timer = null;
      if (!ref) return;
      const json = JSON.stringify(window.app.get());
      sent.add(json);
      try {
        await F.setDoc(ref, { data: json, email: user.email || '', updated: F.serverTimestamp() });
        status('Guardado en la nube · ' + hhmm(), 'ok');
      } catch (e) { sent.delete(json); status(errText(e), 'err'); }
    }
    window.cloud = {
      on: false,
      queue() { if (!ref) return; clearTimeout(timer); status('Guardando en la nube…', 'busy'); timer = setTimeout(push, 700); }
    };

    function drawOut() {
      box.innerHTML = '<span class="dot"></span><span class="st">Solo en este navegador</span><button type="button" class="btn sm" id="cl-in">Entrar con Google</button>';
      box.querySelector('#cl-in').addEventListener('click', () =>
        A.signInWithPopup(auth, new A.GoogleAuthProvider()).catch(e => status(errText(e), 'err')));
    }
    function drawIn() {
      box.innerHTML = `<span class="dot busy"></span><span class="st">Conectando…</span><button type="button" class="btn ghost sm" id="cl-out" title="${(user.email || '').replace(/"/g, '')}">Salir</button>`;
      box.querySelector('#cl-out').addEventListener('click', async () => {
        if (timer) { clearTimeout(timer); await push(); }
        await A.signOut(auth);
        // No dejar datos de alumnos en un equipo compartido
        window.app.clearLocal(); window.app.load(window.app.seed());
      });
    }

    A.onAuthStateChanged(auth, u => {
      user = u;
      if (unsub) { unsub(); unsub = null; }
      if (!u) { ref = null; window.cloud.on = false; drawOut(); return; }
      ref = F.doc(db, 'academias', u.uid);
      window.cloud.on = true; drawIn();
      unsub = F.onSnapshot(ref, snap => {
        if (snap.metadata.hasPendingWrites) return;
        if (!snap.exists()) { push(); return; } // primera vez: sube lo que hay en este navegador
        const json = snap.data().data;
        if (sent.has(json)) { sent.delete(json); status('Guardado en la nube · ' + hhmm(), 'ok'); return; }
        if (timer) return; // hay cambios locales por subir; se suben y ganan
        try { window.app.load(JSON.parse(json)); status('Sincronizado · ' + hhmm(), 'ok'); }
        catch (e) { status('Los datos de la nube no se pudieron leer', 'err'); }
      }, e => status(errText(e), 'err'));
    });
  } catch (e) {
    status('No se pudo cargar Firebase', 'err');
    console.error(e);
  }
}
