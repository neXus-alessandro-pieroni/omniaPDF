/* Template locandina Omnia Casa — condiviso da anteprima ed export (generato dal design approvato) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Poster = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SEDE = { via: 'Via della Repubblica, 4', citta: '63822 Porto San Giorgio (FM)' };
  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  var GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ph(value, placeholder) {
    return value && String(value).trim() ? esc(String(value).trim()) : esc(placeholder);
  }
  function safeUrl(u) {
    u = (u || '').trim();
    if (!u) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
    return /^https?:\/\//i.test(u) ? u : '';
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) ? null : d;
  }

  /** Elenco dei campi importanti ancora vuoti. */
  function missing(c) {
    var out = [];
    if (!(c.condominio || '').trim()) out.push('Nome condominio');
    if (!parseDate(c.data)) out.push('Data');
    if (!(c.ora || '').trim()) out.push('Ora');
    if (!(c.luogo1 || '').trim()) out.push('Luogo');
    var items = (c.ordine || []).filter(function (x) { return x && x.trim(); });
    if (c.mostraOrdine !== false && !items.length) out.push('Ordine del giorno');
    if (c.zoom) {
      if (!safeUrl(c.zoomLink)) out.push('Link Zoom');
    }
    return out;
  }

  function chip(label, value) {
    return `<div style="padding: 9px 22px; border-radius: 18px; border: 1.5px solid rgba(255,255,255,0.55); background: linear-gradient(180deg, rgba(255,255,255,0.30), rgba(255,255,255,0.08)); box-shadow: inset 0 1.5px 0 rgba(255,255,255,0.7), inset 0 -8px 16px rgba(255,255,255,0.06), 0 8px 18px rgba(0,40,20,0.18); backdrop-filter: blur(14px); display: flex; flex-direction: column; gap: 2px">
<div style="font-size: 13px; font-weight: 800; letter-spacing: 0.18em; color: rgba(255,255,255,0.75)">${label}</div>
<div style="font-size: 25px; font-weight: 800; color: #fff; white-space: nowrap; letter-spacing: 0.04em">${value}</div>
</div>`;
  }

  function zoomHtml(c, land) {
    var url = safeUrl(c.zoomLink);
    var linkTag = url ? 'a' : 'span';
    var linkAttr = url ? ' href="' + esc(url) + '"' : '';
    var chipsHtml = '';
    var zid = (c.zoomId || '').trim(), zpw = (c.zoomPass || '').trim();
    if (zid || zpw) {
      chipsHtml = '<div style="display: flex; gap: 14px">' +
        (zid ? chip('ID RIUNIONE', esc(zid)) : '') +
        (zpw ? chip('PASSCODE', esc(zpw)) : '') + '</div>';
    }
    var html = `<div style="position: relative; margin: 0 -80px; box-sizing: border-box; padding: 30px 80px; border-top: 1.5px solid rgba(255,255,255,0.55); border-bottom: 1.5px solid rgba(255,255,255,0.3); background: linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.12)); box-shadow: inset 0 2px 2px rgba(255,255,255,0.6), inset 0 -2px 6px rgba(255,255,255,0.15), 0 20px 50px rgba(0,0,0,0.25); backdrop-filter: blur(30px) saturate(170%); display: flex; align-items: center; gap: 32px">
<div style="flex: none; width: 112px; height: 112px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.7); background: linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.12)); box-shadow: inset 0 2px 3px rgba(255,255,255,0.8), 0 12px 30px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center">
<svg width="68" height="68" viewBox="0 0 84 84" aria-hidden="true">
<rect x="4" y="18" width="52" height="48" rx="10" fill="#FFFFFF"/>
<path d="M60 36 L80 22 V62 L60 48 Z" fill="#FFFFFF"/>
</svg>
</div>
<div style="display: flex; flex-direction: column; gap: 10px">
<div style="font-size: 38px; font-weight: 900; line-height: 1.05; letter-spacing: -0.5px; white-space: nowrap">Puoi partecipare anche online con Zoom</div>
<div style="display: flex; align-items: center; gap: 24px; margin-top: 6px">
<${linkTag}${linkAttr} style="display: inline-flex; align-items: center; gap: 12px; padding: 14px 30px; border-radius: 999px; border: 1.5px solid rgba(255,255,255,0.95); background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(206,236,184,0.85)); box-shadow: inset 0 2px 2px #FFFFFF, inset 0 -4px 8px rgba(20,90,54,0.25), 0 12px 26px rgba(0,0,0,0.35); color: #17482F; font-size: 24px; font-weight: 800; text-decoration: none; white-space: nowrap">Entra nella riunione<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#17482F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg></${linkTag}>
${chipsHtml}
</div>
</div>
</div>`;
    if (land) {
      html = html.replace('margin: 0 -80px; box-sizing: border-box; padding: 30px 80px;', 'margin: 0; box-sizing: border-box; padding: 24px 30px; border-radius: 34px; overflow: hidden;')
        .replace('width: 112px; height: 112px', 'width: 92px; height: 92px').replace('gap: 32px', 'gap: 26px')
        .replace('font-size: 38px; font-weight: 900', 'font-size: 31px; font-weight: 900')
        .replace('gap: 24px; margin-top: 6px', 'gap: 16px 20px; margin-top: 6px; flex-wrap: wrap');
    }
    return html;
  }

  function agendaHtml(c, land) {
    if (c.mostraOrdine === false) return '';
    var list = (c.ordine || []).map(function (x) { return (x || '').trim(); }).filter(Boolean).slice(0, 10);
    if (!list.length) return '';
    var n = list.length;
    var big = land ? 8 : 5, mid = land ? 10 : 7;
    var circ = n > mid ? 38 : n > big ? 42 : 48;
    var nfs = n > mid ? 19 : n > big ? 21 : 24;
    var tfs = n > mid ? 22 : n > big ? 25 : 28;
    var gap = n > mid ? 9 : n > big ? 11 : 14;
    var itemsHtml = list.map(function (t, i) {
      var text = esc(t); var nn = i + 1;
      return itemTpl(nn, text, circ, nfs, tfs);
    }).join('\n');
    var html = `<div style="position: relative; box-sizing: border-box; border-radius: 38px; border: 1.5px solid rgba(255,255,255,0.4); background: linear-gradient(135deg, rgba(255,255,255,0.24), rgba(255,255,255,0.07)); box-shadow: inset 0 2px 2px rgba(255,255,255,0.55), inset 0 -3px 8px rgba(255,255,255,0.1), 0 24px 50px rgba(0,0,0,0.28); backdrop-filter: blur(26px) saturate(160%); padding: 34px 40px 36px 40px; display: flex; flex-direction: column; gap: 20px">
<div style="font-size: 36px; font-weight: 800; letter-spacing: -0.5px">Ordine del giorno</div>
<div style="display: flex; flex-direction: column; gap: ${gap}px">
${itemsHtml}
</div>
</div>`;
    if (land) html = html.replace('position: relative; box-sizing: border-box; border-radius: 38px;', 'position: relative; box-sizing: border-box; height: 100%; border-radius: 38px;');
    return html;
  }

  function itemTpl(n, text, circ, nfs, tfs) {
    return `<div style="display: flex; align-items: center; gap: 20px">
<div style="flex: none; width: ${circ}px; height: ${circ}px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.7); background: linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0.15)); box-shadow: inset 0 2px 2px rgba(255,255,255,0.7); font-size: ${nfs}px; font-weight: 800; display: flex; align-items: center; justify-content: center">${n}</div>
<div style="font-size: ${tfs}px; font-weight: 600">${text}</div>
</div>`;
  }

  /** HTML interno della locandina (div radice 1123 x 1587 px). */
  function rootPortrait(c, logo) {
    var d = parseDate(c.data);
    var titolo = ph(c.titolo, 'Riunione di condominio');
    var sub = [ph(c.condominio, '[NOME CONDOMINIO]')];
    if ((c.indirizzo || '').trim()) sub.push(esc(c.indirizzo.trim()));
    var sottotitolo = sub.join(' · ');
    var dataBig = d ? d.getDate() + ' ' + MESI[d.getMonth()] : '[DATA]';
    var dataSub = d ? GIORNI[d.getDay()] + ' ' + d.getFullYear() : '[gg/mm/aaaa]';
    var oraBig = ph(c.ora, '[ORA]');
    var l1 = (c.luogo1 || '').trim(), l2 = (c.luogo2 || '').trim();
    var luogoLabel = (l1 === SEDE.via && l2 === SEDE.citta) ? 'LUOGO · SEDE' : 'LUOGO';
    var luogo1 = l1 ? esc(l1) : '[LUOGO]';
    var luogo2 = esc(l2);
    var luogoFs = l1.length > 30 ? 24 : l1.length > 24 ? 27 : 31;
    var zoomBlock = c.zoom ? zoomHtml(c, false) : '';
    var agendaBlock = agendaHtml(c, false);
    return `<div style="position: relative; width: 1123px; height: 1587px; box-sizing: border-box; background: #0E3A25; color: #FFFFFF; font-family: 'Inter', sans-serif; overflow: hidden; padding: 84px 80px 60px 80px; display: flex; flex-direction: column; justify-content: space-between">

<div style="position: absolute; left: 0; top: 0; width: 1123px; height: 1587px; background: linear-gradient(160deg, #0E3A25 0%, #145A36 45%, #0B4A3A 100%)"></div>
<div style="position: absolute; right: -180px; top: -140px; width: 700px; height: 700px; border-radius: 50%; background: #A9D072; opacity: 0.55; filter: blur(90px)"></div>
<div style="position: absolute; left: -220px; top: 420px; width: 620px; height: 620px; border-radius: 50%; background: #22A034; opacity: 0.7; filter: blur(100px)"></div>
<div style="position: absolute; right: -120px; top: 760px; width: 520px; height: 520px; border-radius: 50%; background: #2FB5A0; opacity: 0.45; filter: blur(100px)"></div>
<div style="position: absolute; right: 60px; top: 1200px; width: 380px; height: 380px; border-radius: 50%; background: #EA661D; opacity: 0.55; filter: blur(80px)"></div>
<div style="position: absolute; left: 20px; top: 1220px; width: 560px; height: 480px; border-radius: 50%; background: #A9D072; opacity: 0.7; filter: blur(90px)"></div>

<div style="position: relative; display: flex; flex-direction: column; gap: 26px">
<h1 style="margin: 0; font-size: 142px; line-height: 0.93; font-weight: 900; letter-spacing: -4px; text-wrap: balance; text-shadow: 0 6px 30px rgba(0,0,0,0.25)">${titolo}</h1>
<div style="font-size: 32px; font-weight: 500; color: rgba(255,255,255,0.88)">${sottotitolo}</div>
</div>

<div style="position: relative; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 1.8fr); gap: 20px">
<div style="box-sizing: border-box; border-radius: 34px; border: 1.5px solid rgba(255,255,255,0.45); background: linear-gradient(135deg, rgba(255,255,255,0.30), rgba(255,255,255,0.08)); box-shadow: inset 0 2px 2px rgba(255,255,255,0.65), inset 0 -3px 8px rgba(255,255,255,0.12), 0 24px 50px rgba(0,0,0,0.28); backdrop-filter: blur(26px) saturate(160%); padding: 26px 26px 28px 26px; display: flex; flex-direction: column; gap: 8px">
<div style="font-size: 20px; font-weight: 800; letter-spacing: 4px; color: #D9EDB8">DATA</div>
<div style="font-size: 42px; font-weight: 800; line-height: 1.05">${dataBig}</div>
<div style="font-size: 20px; font-weight: 500; color: rgba(255,255,255,0.8)">${dataSub}</div>
</div>
<div style="box-sizing: border-box; border-radius: 34px; border: 1.5px solid rgba(255,255,255,0.45); background: linear-gradient(135deg, rgba(255,255,255,0.30), rgba(255,255,255,0.08)); box-shadow: inset 0 2px 2px rgba(255,255,255,0.65), inset 0 -3px 8px rgba(255,255,255,0.12), 0 24px 50px rgba(0,0,0,0.28); backdrop-filter: blur(26px) saturate(160%); padding: 26px 26px 28px 26px; display: flex; flex-direction: column; gap: 8px">
<div style="font-size: 20px; font-weight: 800; letter-spacing: 4px; color: #D9EDB8">ORA</div>
<div style="font-size: 42px; font-weight: 800; line-height: 1.05">${oraBig}</div>

</div>
<div style="box-sizing: border-box; border-radius: 34px; border: 1.5px solid rgba(255,255,255,0.45); background: linear-gradient(135deg, rgba(255,255,255,0.30), rgba(255,255,255,0.08)); box-shadow: inset 0 2px 2px rgba(255,255,255,0.65), inset 0 -3px 8px rgba(255,255,255,0.12), 0 24px 50px rgba(0,0,0,0.28); backdrop-filter: blur(26px) saturate(160%); padding: 26px 26px 28px 26px; display: flex; flex-direction: column; gap: 8px">
<div style="font-size: 20px; font-weight: 800; letter-spacing: 4px; color: #D9EDB8">${luogoLabel}</div>
<div style="font-size: ${luogoFs}px; font-weight: 800; line-height: 1.1">${luogo1}</div>
<div style="font-size: 22px; font-weight: 500; color: rgba(255,255,255,0.85)">${luogo2}</div>
</div>
</div>

${zoomBlock}

${agendaBlock}

<div style="position: relative; box-sizing: border-box; margin: 0 -80px; border-top: 2px solid rgba(255,255,255,0.95); border-bottom: 2px solid rgba(255,255,255,0.35); background: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 55%), linear-gradient(135deg, rgba(255,255,255,0.62), rgba(214,238,196,0.42)); box-shadow: inset 0 3px 3px #FFFFFF, inset 0 14px 26px rgba(255,255,255,0.55), inset 0 -16px 30px rgba(20,90,54,0.28), inset 0 -2px 2px rgba(255,255,255,0.6), 0 34px 60px rgba(0,0,0,0.45); backdrop-filter: blur(34px) saturate(180%); padding: 30px 80px; display: flex; align-items: center; gap: 40px">
<div style="flex: none; box-sizing: border-box; width: 300px; display: flex; align-items: center; justify-content: center">
<img src="${logo}" alt="Omnia Casa Group — Amministrazioni Condominiali" style="width: 300px; height: auto; display: block">
</div>
<div style="flex: none; align-self: stretch; width: 2px; margin: 4px 0; border-radius: 2px; background: linear-gradient(180deg, rgba(23,72,47,0), rgba(23,72,47,0.5) 20%, rgba(23,72,47,0.5) 80%, rgba(23,72,47,0)); box-shadow: 2px 0 0 rgba(255,255,255,0.9)"></div>
<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px">
<div style="display: flex; align-items: center; gap: 18px">
<div style="flex: none; width: 48px; height: 48px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.95); background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(190,226,160,0.6)); box-shadow: inset 0 2px 2px #FFFFFF, inset 0 -3px 6px rgba(20,90,54,0.25), 0 8px 18px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#17482F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
<div style="font-size: 30px; font-weight: 800; color: #14281D; white-space: nowrap">0734 672305</div>
</div>
<div style="display: flex; align-items: center; gap: 18px">
<div style="flex: none; width: 48px; height: 48px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.95); background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(190,226,160,0.6)); box-shadow: inset 0 2px 2px #FFFFFF, inset 0 -3px 6px rgba(20,90,54,0.25), 0 8px 18px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#17482F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></div>
<div style="font-size: 30px; font-weight: 800; color: #14281D; white-space: nowrap">info@omnia-casa.it</div>
</div>
<div style="display: flex; align-items: center; gap: 18px">
<div style="flex: none; width: 48px; height: 48px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.95); background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(190,226,160,0.6)); box-shadow: inset 0 2px 2px #FFFFFF, inset 0 -3px 6px rgba(20,90,54,0.25), 0 8px 18px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#17482F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
<div style="font-size: 22px; font-weight: 700; line-height: 1.3; color: #14281D; white-space: nowrap">Via della Repubblica, 4<br>63822 Porto San Giorgio (FM)</div>
</div>
</div>
</div>

</div>`;
  }

  var CARD = "box-sizing: border-box; border-radius: 34px; border: 1.5px solid rgba(255,255,255,0.45); background: linear-gradient(135deg, rgba(255,255,255,0.30), rgba(255,255,255,0.08)); box-shadow: inset 0 2px 2px rgba(255,255,255,0.65), inset 0 -3px 8px rgba(255,255,255,0.12), 0 24px 50px rgba(0,0,0,0.28); backdrop-filter: blur(26px) saturate(160%); padding: 26px 26px 28px 26px; display: flex; flex-direction: column; gap: 8px";
  var FOOT = "position: relative; box-sizing: border-box; margin: 0 -80px; border-top: 2px solid rgba(255,255,255,0.95); border-bottom: 2px solid rgba(255,255,255,0.35); background: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 55%), linear-gradient(135deg, rgba(255,255,255,0.62), rgba(214,238,196,0.42)); box-shadow: inset 0 3px 3px #FFFFFF, inset 0 14px 26px rgba(255,255,255,0.55), inset 0 -16px 30px rgba(20,90,54,0.28), inset 0 -2px 2px rgba(255,255,255,0.6), 0 34px 60px rgba(0,0,0,0.45); backdrop-filter: blur(34px) saturate(180%); padding: 30px 80px; display: flex; align-items: center; gap: 40px";
  var DIVIDER = "flex: none; align-self: stretch; width: 2px; margin: 4px 0; border-radius: 2px; background: linear-gradient(180deg, rgba(23,72,47,0), rgba(23,72,47,0.5) 20%, rgba(23,72,47,0.5) 80%, rgba(23,72,47,0)); box-shadow: 2px 0 0 rgba(255,255,255,0.9)";
  var ICON = "flex: none; width: 48px; height: 48px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.95); background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(190,226,160,0.6)); box-shadow: inset 0 2px 2px #FFFFFF, inset 0 -3px 6px rgba(20,90,54,0.25), 0 8px 18px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center";
  var PH_SVG = "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"/>";
  var MAIL_SVG = "<rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"/><path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\"/>";
  var PIN_SVG = "<path d=\"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/>";

  function svgIcon(inner) {
    return '<div style="' + ICON.replace('width: 48px; height: 48px', 'width: 52px; height: 52px') + '"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#17482F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg></div>';
  }
  function contact(inner, textHtml, fs, fw) {
    return '<div style="display: flex; align-items: center; gap: 16px">' + svgIcon(inner) +
      '<div style="font-size: ' + fs + 'px; font-weight: ' + fw + '; line-height: 1.25; color: #14281D; white-space: nowrap">' + textHtml + '</div></div>';
  }

  /** Locandina orizzontale (1587 x 1123 px). */
  function rootLandscape(c, logo) {
    var d = parseDate(c.data);
    var titolo = ph(c.titolo, 'Riunione di condominio');
    var sub = [ph(c.condominio, '[NOME CONDOMINIO]')];
    if ((c.indirizzo || '').trim()) sub.push(esc(c.indirizzo.trim()));
    var sottotitolo = sub.join(' · ');
    var dataBig = d ? d.getDate() + ' ' + MESI[d.getMonth()] : '[DATA]';
    var dataSub = d ? GIORNI[d.getDay()] + ' ' + d.getFullYear() : '[gg/mm/aaaa]';
    var oraBig = ph(c.ora, '[ORA]');
    var l1 = (c.luogo1 || '').trim(), l2 = (c.luogo2 || '').trim();
    var luogoLabel = (l1 === SEDE.via && l2 === SEDE.citta) ? 'LUOGO · SEDE' : 'LUOGO';
    var luogo1 = l1 ? esc(l1) : '[LUOGO]';
    var luogo2 = esc(l2);
    var luogoFs = l1.length > 30 ? 22 : l1.length > 24 ? 24 : 27;
    var luogoNw = l1.length <= 26 ? 'white-space: nowrap; ' : '';
    var zoomBlock = c.zoom ? zoomHtml(c, true) : '';
    var agendaBlock = agendaHtml(c, true);
    var card = function (label, big, subHtml, fs, nw) {
      return '<div style="' + CARD.replace('padding: 26px 26px 28px 26px', 'padding: 22px 24px 24px 24px') + '">' +
        '<div style="font-size: 19px; font-weight: 800; letter-spacing: 4px; color: #D9EDB8">' + label + '</div>' +
        '<div style="' + (nw || '') + 'font-size: ' + fs + 'px; font-weight: 800; line-height: 1.08">' + big + '</div>' +
        (subHtml ? '<div style="font-size: 20px; font-weight: 500; color: rgba(255,255,255,0.82)">' + subHtml + '</div>' : '') + '</div>';
    };
    var cols = agendaBlock ? 'minmax(0, 1fr) 600px' : 'minmax(0, 1fr)';
    var footStyle = FOOT.replace('margin: 0 -80px', 'margin: 0 -72px').replace('padding: 30px 80px', 'padding: 26px 72px').replace('gap: 40px', 'gap: 44px');
    return `<div style="position: relative; width: 1587px; height: 1123px; box-sizing: border-box; background: #0E3A25; color: #FFFFFF; font-family: 'Inter', sans-serif; overflow: hidden; padding: 64px 72px 52px 72px; display: flex; flex-direction: column; justify-content: space-between; gap: 34px">

<div style="position: absolute; left: 0; top: 0; width: 1587px; height: 1123px; background: linear-gradient(160deg, #0E3A25 0%, #145A36 45%, #0B4A3A 100%)"></div>
<div style="position: absolute; right: -160px; top: -200px; width: 760px; height: 700px; border-radius: 50%; background: #A9D072; opacity: 0.55; filter: blur(95px)"></div>
<div style="position: absolute; left: -240px; top: 360px; width: 680px; height: 620px; border-radius: 50%; background: #22A034; opacity: 0.7; filter: blur(100px)"></div>
<div style="position: absolute; right: 120px; top: 520px; width: 560px; height: 480px; border-radius: 50%; background: #2FB5A0; opacity: 0.45; filter: blur(100px)"></div>
<div style="position: absolute; right: -60px; top: 860px; width: 420px; height: 380px; border-radius: 50%; background: #EA661D; opacity: 0.5; filter: blur(85px)"></div>
<div style="position: absolute; left: 60px; top: 900px; width: 620px; height: 420px; border-radius: 50%; background: #A9D072; opacity: 0.65; filter: blur(95px)"></div>

<div style="position: relative; flex: 1; min-height: 0; display: grid; grid-template-columns: ${cols}; gap: 40px">
<div style="display: flex; flex-direction: column; justify-content: space-between; gap: 22px; min-width: 0">
<div style="display: flex; flex-direction: column; gap: 20px">
<h1 style="margin: 0; font-size: 112px; line-height: 0.94; font-weight: 900; letter-spacing: -3.5px; text-wrap: balance; text-shadow: 0 6px 30px rgba(0,0,0,0.25)">${titolo}</h1>
<div style="font-size: 30px; font-weight: 500; color: rgba(255,255,255,0.88)">${sottotitolo}</div>
</div>
<div style="display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.7fr) minmax(0, 1.75fr); gap: 16px">
${card('DATA', dataBig, dataSub, 32, 'white-space: nowrap; ')}
${card('ORA', oraBig, '', 34, 'white-space: nowrap; ')}
${card(luogoLabel, luogo1, luogo2, luogoFs, luogoNw)}
</div>
${zoomBlock}
</div>
${agendaBlock}
</div>

<div style="${footStyle}">
<div style="flex: none; box-sizing: border-box; width: 290px; display: flex; align-items: center; justify-content: center">
<img src="${logo}" alt="Omnia Casa Group — Amministrazioni Condominiali" style="width: 290px; height: auto; display: block">
</div>
<div style="${DIVIDER}"></div>
<div style="flex: 1; min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 28px">
${contact(PH_SVG, '0734 672305', 28, 800)}
${contact(MAIL_SVG, 'info@omnia-casa.it', 28, 800)}
${contact(PIN_SVG, 'Via della Repubblica, 4<br>63822 Porto San Giorgio (FM)', 21, 700)}
</div>
</div>

</div>`;
  }

  /** HTML interno della locandina: verticale 1123 x 1587 px, orizzontale 1587 x 1123 px. */
  function rootHtml(c, logo) {
    return c && c.orientamento === 'h' ? rootLandscape(c, logo) : rootPortrait(c, logo);
  }

  /** Documento HTML completo. fontCss: @font-face già pronti. */
  function documentHtml(c, opts) {
    opts = opts || {};
    return '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Locandina</title><style>' +
      (opts.fontCss || '') +
      'html,body{margin:0;padding:0;background:#0E3A25}body{font-family:Inter,sans-serif}' +
      '</style></head><body>' + rootHtml(c, opts.logo || '') + '</body></html>';
  }

  return { dims: function (c) { return c && c.orientamento === 'h' ? { w: 1587, h: 1123 } : { w: 1123, h: 1587 }; }, SEDE: SEDE, esc: esc, missing: missing, parseDate: parseDate, safeUrl: safeUrl, rootHtml: rootHtml, documentHtml: documentHtml };
});
