document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const panel = document.getElementById('settings-panel');
  const toggle = document.getElementById('settings-toggle');
  const opciones = document.getElementById('settings-options');
  const botonesTema = opciones.querySelectorAll('button[data-theme]');
  const botonesOrden = opciones.querySelectorAll('button[data-orden]');
  const contenedor = document.getElementById('nav-links');

  toggle.addEventListener('click', () => opciones.classList.toggle('abierto'));
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target)) opciones.classList.remove('abierto');
  });

  function aplicarTema(tema) {
    botonesTema.forEach(b => { if (b.dataset.theme) body.classList.remove(b.dataset.theme); });
    if (tema) body.classList.add(tema);
    botonesTema.forEach(b => b.classList.toggle('activo', b.dataset.theme === tema));
    localStorage.setItem('tema-sitio', tema);
  }
  aplicarTema(localStorage.getItem('tema-sitio') || '');
  botonesTema.forEach(b => b.addEventListener('click', () => aplicarTema(b.dataset.theme)));

  function obtenerVisitas() {
    try { return JSON.parse(localStorage.getItem('visitas-enlaces')) || {}; }
    catch { return {}; }
  }

  function obtenerTiempos() {
    try { return JSON.parse(localStorage.getItem('tiempo-enlaces')) || {}; }
    catch { return {}; }
  }

  function registrarRegreso() {
    const sesion = JSON.parse(localStorage.getItem('sesion-actual') || 'null');
    if (sesion && sesion.href) {
      const segundos = Math.round((Date.now() - sesion.inicio) / 1000);
      if (segundos > 0 && segundos < 6 * 60 * 60) {
        const tiempos = obtenerTiempos();
        tiempos[sesion.href] = (tiempos[sesion.href] || 0) + segundos;
        localStorage.setItem('tiempo-enlaces', JSON.stringify(tiempos));
      }
      localStorage.removeItem('sesion-actual');
    }
  }

  function alfabetizarTemas() {
    const lista = document.getElementById('temas-lista');
    if (!lista) return;
    const botones = Array.from(lista.querySelectorAll('button[data-theme]'));
    botones.sort((a, b) =>
      a.textContent.trim().localeCompare(b.textContent.trim(), 'es', { sensitivity: 'base' })
    );
    botones.forEach(boton => lista.appendChild(boton));
  }

  alfabetizarTemas();

  function formatoTiempo(segundosTotales) {
    if (!segundosTotales) return 'Sin jugar aún';
    const horas = Math.floor(segundosTotales / 3600);
    const minutos = Math.floor((segundosTotales % 3600) / 60);
    if (horas > 0) return `${horas}h ${minutos}m jugadas`;
    if (minutos > 0) return `${minutos}m jugadas`;
    return `${segundosTotales}s jugados`;
  }

  function actualizarInfoTiempo() {
    const tiempos = obtenerTiempos();
    contenedor.querySelectorAll('a').forEach(enlace => {
      let info = enlace.querySelector('.tiempo-info');
      if (!info) {
        info = document.createElement('small');
        info.className = 'tiempo-info';
        enlace.appendChild(info);
      }
      info.textContent = formatoTiempo(tiempos[enlace.href] || 0);
    });
  }

  if (contenedor) {
    contenedor.querySelectorAll('a').forEach(enlace => {
      enlace.addEventListener('click', () => {
        const visitas = obtenerVisitas();
        visitas[enlace.href] = (visitas[enlace.href] || 0) + 1;
        localStorage.setItem('visitas-enlaces', JSON.stringify(visitas));

        localStorage.setItem('sesion-actual', JSON.stringify({ href: enlace.href, inicio: Date.now() }));
      });
    });
  }

  registrarRegreso();

  function ordenarEnlaces(tipo) {
    if (!contenedor) return;
    const visitas = obtenerVisitas();
    const tiempos = obtenerTiempos();
    const enlaces = Array.from(contenedor.querySelectorAll('a'));

    const posicionesIniciales = new Map();
    enlaces.forEach(el => posicionesIniciales.set(el, el.getBoundingClientRect()));

    let ordenados;
    if (tipo === 'za') {
      ordenados = enlaces.sort((a, b) =>
        b.textContent.trim().localeCompare(a.textContent.trim(), 'es', { sensitivity: 'base' })
      );
    } else if (tipo === 'visitas') {
      ordenados = enlaces.sort((a, b) => (visitas[b.href] || 0) - (visitas[a.href] || 0));
    } else if (tipo === 'tiempo') {
      ordenados = enlaces.sort((a, b) => (tiempos[b.href] || 0) - (tiempos[a.href] || 0));
    } else {
      ordenados = enlaces.sort((a, b) =>
        a.textContent.trim().localeCompare(b.textContent.trim(), 'es', { sensitivity: 'base' })
      );
    }

    ordenados.forEach(el => contenedor.appendChild(el));

    ordenados.forEach(el => {
      const posicionFinal = el.getBoundingClientRect();
      const posicionInicial = posicionesIniciales.get(el);
      const deltaY = posicionInicial.top - posicionFinal.top;
      if (deltaY) {
        el.style.transition = 'none';
        el.style.transform = `translateY(${deltaY}px)`;
        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.5s ease';
          el.style.transform = '';
          el.addEventListener('transitionend', () => { el.style.transition = ''; }, { once: true });
        });
      }
    });

    botonesOrden.forEach(b => b.classList.toggle('activo', b.dataset.orden === tipo));
    localStorage.setItem('orden-sitio', tipo);
  }

  botonesOrden.forEach(b => b.addEventListener('click', () => ordenarEnlaces(b.dataset.orden)));

  ordenarEnlaces(localStorage.getItem('orden-sitio') || 'az');
  actualizarInfoTiempo();
});

