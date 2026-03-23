document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  const KS = {
    folios: 'cu12_folios',
    alertas: 'cu12_alertas',
    mensajes: 'cu12_mensajes',
    auditoria: 'cu12_auditoria'
  };

  const UI = {
    alert: document.getElementById('alert'),
    chipCount: document.getElementById('chipCount'),
    statusChip: document.getElementById('statusChip'),
    auditCount: document.getElementById('auditCount'),
    table: document.getElementById('foliosTable').querySelector('tbody'),
    search: document.getElementById('searchInput'),
    folioSel: document.getElementById('folioSel'),
    prioridad: document.getElementById('prioridad'),
    justificacion: document.getElementById('justificacion'),
    errPrioridad: document.getElementById('errPrioridad'),
    errJustificacion: document.getElementById('errJustificacion'),
    enviarBtn: document.getElementById('enviarBtn'),
    limpiarBtn: document.getElementById('limpiarBtn'),
    confirmarBtn: document.getElementById('confirmarBtn'),
    timeline: document.getElementById('auditTimeline'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    overlay: document.getElementById('overlay')
  };

  const Session = {
    user: { id: 'admin-1', name: 'Administrador', role: 'Administrador' },
    isAdmin() { return this.user.role === 'Administrador'; }
  };

  const Store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  function daysDiff(fromISO, toISO) {
    const a = new Date(fromISO); const b = new Date(toISO);
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
  }
  function todayISO() {
    const d = new Date(); const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  }
  function showAlert(type, text) {
    UI.alert.classList.remove('hidden','alert-success','alert-error','alert-info');
    if (type === 'success') UI.alert.classList.add('alert-success');
    if (type === 'error') UI.alert.classList.add('alert-error');
    if (type === 'info') UI.alert.classList.add('alert-info');
    UI.alert.textContent = text;
  }
  function clearAlert() {
    UI.alert.classList.add('hidden');
    UI.alert.textContent = '';
    UI.alert.classList.remove('alert-success','alert-error','alert-info');
  }

  const Model = {
    seedIfNeeded() {
      const seeded = Store.get(KS.folios, null);
      if (Array.isArray(seeded) && seeded.length) return;
      const base = todayISO();
      const data = [
        { folio: 'MO-2026-000123', asunto: 'Informe trimestral pendiente', responsable: 'Dirección Técnica', fechaLimite: shiftDays(base, -8), estado: 'Retraso' },
        { folio: 'MO-2026-000124', asunto: 'Entrega de evidencias auditoría', responsable: 'Unidad de Gestión', fechaLimite: shiftDays(base, -12), estado: 'Retraso' },
        { folio: 'MO-2026-000125', asunto: 'Respuesta a observación', responsable: 'Recursos Humanos', fechaLimite: shiftDays(base, -3), estado: 'Retraso' },
        { folio: 'MO-2026-000126', asunto: 'Cierre de hallazgos', responsable: 'Finanzas', fechaLimite: shiftDays(base, +2), estado: 'En tiempo' }
      ];
      Store.set(KS.folios, data);
      Store.set(KS.alertas, []);
      Store.set(KS.mensajes, []);
      Store.set(KS.auditoria, []);
    },
    listFolios() {
      return Store.get(KS.folios, []);
    },
    setFolios(list) {
      Store.set(KS.folios, list);
    },
    pushAuditoria(evento) {
      const arr = Store.get(KS.auditoria, []);
      arr.unshift(evento);
      Store.set(KS.auditoria, arr);
    },
    listAuditoria() {
      return Store.get(KS.auditoria, []);
    },
    crearAlerta(payload) {
      const arr = Store.get(KS.alertas, []);
      arr.unshift(payload);
      Store.set(KS.alertas, arr);
    },
    actualizarAlerta(id, patch) {
      const arr = Store.get(KS.alertas, []);
      const idx = arr.findIndex(a => a.id === id);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...patch };
        Store.set(KS.alertas, arr);
      }
    },
    crearMensaje(msg) {
      const arr = Store.get(KS.mensajes, []);
      arr.unshift(msg);
      Store.set(KS.mensajes, arr);
    },
    listAlertas() {
      return Store.get(KS.alertas, []);
    }
  };

  function shiftDays(baseISO, delta) {
    const d = new Date(baseISO);
    d.setDate(d.getDate() + delta);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const View = {
    renderFolios(filter = '') {
      const rows = Model.listFolios()
        .map(f => ({
          ...f,
          diasRetraso: Math.max(0, daysDiff(f.fechaLimite, todayISO()))
        }))
        .filter(f => f.estado === 'Retraso')
        .filter(f => {
          const q = filter.trim().toLowerCase();
          if (!q) return true;
          return (
            f.folio.toLowerCase().includes(q) ||
            f.asunto.toLowerCase().includes(q) ||
            f.responsable.toLowerCase().includes(q)
          );
        });

      UI.table.innerHTML = rows.map(f => `
        <tr>
          <td><strong>${escapeHtml(f.folio)}</strong></td>
          <td>${escapeHtml(f.asunto)}</td>
          <td>${escapeHtml(f.responsable)}</td>
          <td><span class="badge-delay">${f.diasRetraso} días</span></td>
          <td>
            <div class="row-actions">
              <button class="btn-mini" data-select="${f.folio}">Seleccionar</button>
            </div>
          </td>
        </tr>
      `).join('');
      UI.chipCount.textContent = `${rows.length} folios`;
    },
    renderAuditoria() {
      const eventos = Model.listAuditoria();
      UI.timeline.innerHTML = eventos.map(ev => `
        <li>
          <div class="t-dot"></div>
          <div class="t-card">
            <div class="t-title">${escapeHtml(ev.titulo)}</div>
            <div class="t-meta">${escapeHtml(ev.fecha)} · ${escapeHtml(ev.usuario)}</div>
            <div>${escapeHtml(ev.detalle)}</div>
          </div>
        </li>
      `).join('');
      UI.auditCount.textContent = `${eventos.length} eventos`;
    },
    setStatusChip(text, kind) {
      UI.statusChip.textContent = text;
      UI.statusChip.classList.remove('chip-success','chip-warning','chip-info');
      if (kind === 'success') UI.statusChip.classList.add('chip-success');
      if (kind === 'warning') UI.statusChip.classList.add('chip-warning');
      if (kind === 'info') UI.statusChip.classList.add('chip-info');
    },
    setFormEnabled(enabled) {
      UI.enviarBtn.disabled = !enabled;
    }
  };

  function escapeHtml(t) {
    return String(t ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  const Controller = {
    selectedFolio: null,
    selectedDiasRetraso: 0,
    alertaIdActual: null,
    init() {
      Model.seedIfNeeded();
      View.renderFolios();
      View.renderAuditoria();
      View.setStatusChip('Pendiente','warning');
      UI.folioSel.value = '';
      UI.enviarBtn.disabled = true;
      UI.confirmarBtn.disabled = true;
      UI.sidebarToggle.addEventListener('click', () => {
        if (UI.sidebar.classList.contains('is-open')) closeSidebar();
        else openSidebar();
      });
      UI.overlay.addEventListener('click', () => { closeSidebar(); });
      UI.search.addEventListener('input', () => View.renderFolios(UI.search.value));
      UI.table.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const folio = btn.dataset.select;
        if (!folio) return;
        this.handleSelectFolio(folio);
      });
      UI.prioridad.addEventListener('change', () => this.validateForm());
      UI.justificacion.addEventListener('input', () => this.validateForm());
      UI.limpiarBtn.addEventListener('click', () => this.resetForm());
      document.getElementById('alertForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.enviarAlerta();
      });
      UI.confirmarBtn.addEventListener('click', () => this.confirmarRecepcion());
    },
    handleSelectFolio(folio) {
      const f = Model.listFolios().find(x => x.folio === folio);
      if (!f) return;
      this.selectedFolio = f.folio;
      this.selectedDiasRetraso = Math.max(0, daysDiff(f.fechaLimite, todayISO()));
      UI.folioSel.value = f.folio;
      View.setStatusChip('Folio seleccionado','info');
      showAlert('info', `Seleccionado ${f.folio} · ${this.selectedDiasRetraso} días de retraso`);
      this.validateForm();
    },
    resetForm() {
      clearAlert();
      UI.folioSel.value = '';
      UI.prioridad.value = '';
      UI.justificacion.value = '';
      UI.errPrioridad.textContent = '';
      UI.errJustificacion.textContent = '';
      UI.prioridad.classList.remove('is-invalid','is-valid');
      UI.justificacion.classList.remove('is-invalid','is-valid');
      this.selectedFolio = null;
      this.selectedDiasRetraso = 0;
      this.alertaIdActual = null;
      UI.confirmarBtn.disabled = true;
      View.setStatusChip('Pendiente','warning');
      UI.enviarBtn.disabled = true;
    },
    validateForm() {
      let ok = true;
      UI.errPrioridad.textContent = '';
      UI.errJustificacion.textContent = '';
      UI.prioridad.classList.remove('is-invalid','is-valid');
      UI.justificacion.classList.remove('is-invalid','is-valid');

      if (!Session.isAdmin()) {
        showAlert('error', 'No cuentas con permisos de Administrador.');
        View.setStatusChip('Permisos insuficientes','warning');
        UI.enviarBtn.disabled = true;
        return false;
      }
      if (!this.selectedFolio) ok = false;
      if (!UI.prioridad.value) {
        UI.errPrioridad.textContent = 'La prioridad es obligatoria.';
        UI.prioridad.classList.add('is-invalid');
        ok = false;
      } else {
        UI.prioridad.classList.add('is-valid');
      }
      const just = UI.justificacion.value.trim();
      if (!just || just.length < 10) {
        UI.errJustificacion.textContent = 'La justificación debe tener al menos 10 caracteres.';
        UI.justificacion.classList.add('is-invalid');
        ok = false;
      } else {
        UI.justificacion.classList.add('is-valid');
      }
      if (this.selectedDiasRetraso <= 5) {
        showAlert('error','El folio debe tener más de 5 días de retraso.');
        View.setStatusChip('No cumple regla de negocio','warning');
        ok = false;
      }
      UI.enviarBtn.disabled = !ok;
      return ok;
    },
    enviarAlerta() {
      clearAlert();
      if (!this.validateForm()) return;

      const now = new Date().toISOString();
      const id = `AL-${Date.now()}`;
      const alerta = {
        id,
        folio: this.selectedFolio,
        prioridad: UI.prioridad.value,
        justificacion: UI.justificacion.value.trim(),
        creadoPor: Session.user.name,
        creadoEn: now,
        estado: 'Enviado',
        recibidoEn: null,
        recibidoPor: null
      };
      Model.crearAlerta(alerta);
      Model.pushAuditoria({
        titulo: 'Alerta generada',
        fecha: now,
        usuario: Session.user.name,
        detalle: `Folio ${alerta.folio} · Prioridad ${alerta.prioridad}`
      });
      View.renderAuditoria();

      const msg = {
        id: `MSG-${Date.now()}`,
        to: 'Área responsable de ' + getResponsable(alerta.folio),
        subject: `Aviso de retraso: ${alerta.folio}`,
        body: alerta.justificacion,
        createdAt: now,
        status: 'enviado'
      };
      Model.crearMensaje(msg);

      this.alertaIdActual = id;
      UI.confirmarBtn.disabled = false;
      View.setStatusChip('Aviso enviado','success');
      showAlert('success', `Aviso enviado para el folio ${alerta.folio}.`);
      this.simularRecepcionAsync(id);
    },
    simularRecepcionAsync(alertaId) {
      setTimeout(() => {
        const now = new Date().toISOString();
        Model.actualizarAlerta(alertaId, { estado: 'Recibido', recibidoEn: now, recibidoPor: 'Sistema de mensajería' });
        Model.pushAuditoria({
          titulo: 'Recepción confirmada (automática)',
          fecha: now,
          usuario: 'Sistema',
          detalle: `Se confirmó recepción de la alerta ${alertaId}`
        });
        View.renderAuditoria();
        showAlert('info','Confirmación de recepción registrada automáticamente.');
      }, 1500);
    },
    confirmarRecepcion() {
      if (!this.alertaIdActual) return;
      const now = new Date().toISOString();
      Model.actualizarAlerta(this.alertaIdActual, { estado: 'Recibido', recibidoEn: now, recibidoPor: Session.user.name });
      Model.pushAuditoria({
        titulo: 'Recepción confirmada (manual)',
        fecha: now,
        usuario: Session.user.name,
        detalle: `Confirmación manual de la alerta ${this.alertaIdActual}`
      });
      View.renderAuditoria();
      UI.confirmarBtn.disabled = true;
      showAlert('success','Recepción confirmada.');
    }
  };

  function getResponsable(folio) {
    const f = Model.listFolios().find(x => x.folio === folio);
    return f ? f.responsable : 'Área';
  }

  function openSidebar() {
    UI.sidebar.classList.add('is-open');
    UI.overlay.classList.remove('hidden');
  }
  function closeSidebar() {
    UI.sidebar.classList.remove('is-open');
    UI.overlay.classList.add('hidden');
  }

  Controller.init();
});
