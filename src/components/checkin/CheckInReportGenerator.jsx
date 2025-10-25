
import { format, parseISO, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency, getCurrencySymbol } from "../utils/formatters";

const EASYGARAGE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68da84aca844db7bb5ada5ae/478ef86e1_Icon-macOS-Default-1024x10242x.png";

export const generateCheckInReportHTML = (reservation, vehicle, client, organization, checkInData) => {
  const startDate = format(parseISO(reservation.start_date), "d MMMM yyyy", { locale: fr });
  const endDate = format(parseISO(reservation.end_date), "d MMMM yyyy", { locale: fr }); // Added for display
  const checkInDate = format(parseISO(checkInData.performed_at), "d MMMM yyyy à HH:mm", { locale: fr });
  const contractNumber = `EDL-IN-${reservation.id.slice(-8).toUpperCase()}`;

  const logoUrl = organization?.logo_url || EASYGARAGE_LOGO;
  const companyName = organization?.name || "EasyGarage";
  const companyInfo = organization?.address || "Service de location de véhicules";

  // CORRECTION: Calculer la durée avec les heures
  const startDateTime = parseISO(`${reservation.start_date}T${reservation.start_time || '18:00'}`);
  const endDateTime = parseISO(`${reservation.end_date}T${reservation.end_time || '18:00'}`);
  const hours = differenceInHours(endDateTime, startDateTime);
  const rentalDays = Math.max(1, Math.ceil(hours / 24));

  const currency = organization?.currency || 'EUR';
  // const currencySymbol = getCurrencySymbol(currency); // Not directly used in HTML generation, kept for context from original file

  // Générer les photos HTML
  let photosHTML = '';
  if (checkInData.photos && checkInData.photos.length > 0) {
    const photosContent = checkInData.photos.map(photo => {
      const label = photo.label ? `<div class="photo-label">${photo.label}</div>` : '';
      return `
        <div class="photo-item">
          <img src="${photo.url}" alt="${photo.label || 'Photo'}" />
          ${label}
        </div>
      `;
    }).join('');

    photosHTML = `
      <section>
        <div class="title"><span class="dot"></span><h2>Photos (${checkInData.photos.length})</h2></div>
        <div class="photo-grid">
          ${photosContent}
        </div>
      </section>
    `;
  }

  // Générer les dégâts HTML
  let damagesHTML = '';
  if (checkInData.damages && checkInData.damages.length > 0) {
    const damagesContent = checkInData.damages.map(damage => `
      <div class="damage-item">
        <div class="damage-header">
          <span class="damage-type">${damage.type} - ${damage.location}</span>
          <span class="damage-severity severity-${damage.severity}">${damage.severity}</span>
        </div>
        <p style="margin:0;color:#7f1d1d;font-size:13px">${damage.description}</p>
      </div>
    `).join('');

    damagesHTML = `
      <section>
        <div class="title"><span class="dot"></span><h2>Dégâts signalés (${checkInData.damages.length})</h2></div>
        ${damagesContent}
      </section>
    `;
  }

  const ownerSignatureHTML = checkInData.owner_signature
    ? `<img src="${checkInData.owner_signature}" alt="Signature loueur" />`
    : '<span style="color:var(--muted);font-size:12px">Non signée</span>';

  const clientSignatureHTML = checkInData.client_signature
    ? `<img src="${checkInData.client_signature}" alt="Signature client" />`
    : '<span style="color:var(--muted);font-size:12px">Non signée</span>';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>État des lieux de départ – ${organization?.name || 'EasyGarage'}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root{
      --brand:#111827;
      --accent:#0ea5e9;
      --muted:#6b7280;
      --border:#e5e7eb;
      --bg:#ffffff;
      --pill:#f1f5f9;
      --danger:#ef4444;
    }
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:var(--bg);color:#111;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;}
    @page{size:A4;margin:18mm 15mm}
    .page{max-width:850px;margin:24px auto;padding:0 16px}
    .doc{background:white;border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(17,24,39,.06)}
    .header{display:flex;align-items:center;justify-content:space-between;padding:28px 32px;border-bottom:1px solid var(--border);background:linear-gradient(180deg,#fafafa,transparent)}
    .brand{display:flex;gap:14px;align-items:center}
    .logo{width:52px;height:52px;border-radius:12px;object-fit:cover;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    .brand h1{margin:0;font-size:22px;line-height:1.2;color:var(--brand)}
    .brand small{display:block;color:var(--muted);font-weight:500;font-size:13px}
    .meta{text-align:right}
    .badge{display:inline-block;background:var(--pill);padding:6px 12px;border-radius:999px;color:var(--brand);font-size:13px;font-weight:600;border:1px solid var(--border)}
    .meta p{margin:.35rem 0 0;color:var(--muted);font-size:12px}
    section{padding:20px 32px}
    .title{display:flex;align-items:center;gap:10px;margin:8px 0 14px}
    .title .dot{width:10px;height:10px;border-radius:999px;background:var(--accent);box-shadow:0 0 0 3px rgba(14,165,233,.15)}
    .title h2{margin:0;font-size:14px;letter-spacing:.3px;text-transform:uppercase;color:#0f172a;font-weight:700}
    .card{border:1px solid var(--border);border-radius:14px;overflow:hidden}
    .card .row{display:grid;grid-template-columns:repeat(12,1fr);gap:0;border-top:1px solid var(--border)}
    .card .row:first-child{border-top:0}
    .cell{padding:12px 14px;border-left:1px solid var(--border);background:#fff;font-size:14px}
    .cell.header{background:#f8fafc;color:#0f172a;font-weight:700;font-size:13px}
    .cell:first-child{border-left:0}
    .span-6{grid-column:span 6}
    .span-4{grid-column:span 4}
    .span-3{grid-column:span 3}
    .span-12{grid-column:1 / -1}
    .muted{color:var(--muted)}
    .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .pill{background:var(--pill);border:1px dashed var(--border);color:#0f172a;border-radius:12px;padding:12px 14px;font-size:14px}
    .photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px}
    .photo-item{border-radius:10px;overflow:hidden;border:1px solid var(--border)}
    .photo-item img{width:100%;height:150px;object-fit:cover}
    .photo-label{padding:8px;background:#f8fafc;text-align:center;font-size:12px;color:var(--muted)}
    .damage-item{border:1px solid #fca5a5;border-radius:10px;padding:12px;margin-top:10px;background:#fef2f2}
    .damage-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .damage-type{font-weight:600;color:#991b1b}
    .damage-severity{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600}
    .severity-leger{background:#fef3c7;color:#92400e}
    .severity-moyen{background:#fed7aa;color:#9a3412}
    .severity-grave{background:#fecaca;color:#991b1b}
    .signs{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:8px}
    .sign{border:1px solid var(--border);border-radius:14px;padding:16px 18px;min-height:140px;background:#fff}
    .sign h3{margin:0 0 8px;font-size:14px;color:var(--muted);font-weight:600}
    .sign .name{font-weight:700;color:var(--brand);font-size:15px}
    .sign .sigbox{margin-top:16px;min-height:80px;border-top:1px dashed var(--border);padding-top:12px;display:flex;align-items:center;justify-content:center}
    .sign img{max-width:200px;max-height:70px}
    .foot{padding:16px;color:var(--muted);text-align:center;border-top:1px solid var(--border);font-size:12px;background:#fafafa}
    
    /* NEW: Bouton de fermeture mobile */
    .close-btn {
      display: none;
      position: fixed;
      top: 16px;
      right: 16px;
      width: 48px;
      height: 48px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      z-index: 9999;
      align-items: center;
      justify-content: center;
    }
    
    @media (max-width: 768px) {
      .close-btn {
        display: flex;
      }
    }
    
    @media print {
      .close-btn {
        display: none !important;
      }
    }
    @media(max-width:740px){
      .header{flex-direction:column;gap:16px;text-align:center}
      .meta{text-align:center}
      .grid-2,.signs{grid-template-columns:1fr}
      .brand{flex-direction:column;text-align:center}
      .photo-grid{grid-template-columns:repeat(2,1fr)}
    }
  </style>
</head>
<body>
  <!-- NEW: Bouton de fermeture -->
  <button class="close-btn" onclick="window.close()">✕</button>
  
  <div class="page">
    <div class="doc">
      <header class="header">
        <div class="brand">
          <img src="${logoUrl}" alt="Logo" class="logo" onerror="this.style.display='none'" />
          <div>
            <h1>État des lieux de départ</h1>
            <small>${companyName} – ${companyInfo}</small>
          </div>
        </div>
        <div class="meta">
          <span class="badge">N° : <strong>${contractNumber}</strong></span>
          <p>Effectué le : <strong>${checkInDate}</strong></p>
        </div>
      </header>

      <section>
        <div class="title"><span class="dot"></span><h2>Informations de la location</h2></div>
        <div class="card">
          <div class="row">
            <div class="cell span-6 header">Client</div>
            <div class="cell span-6 header">Véhicule</div>
          </div>
          <div class="row">
            <div class="cell span-6">${client?.name || ''}</div>
            <div class="cell span-6"><strong>${vehicle?.make || ''} ${vehicle?.model || ''}</strong></div>
          </div>
          <div class="row">
            <div class="cell span-6 header">Email</div>
            <div class="cell span-6 header">Immatriculation</div>
          </div>
          <div class="row">
            <div class="cell span-6">${client?.email || ''}</div>
            <div class="cell span-6"><strong>${vehicle?.plate || ''}</strong></div>
          </div>
          <div class="row">
            <div class="cell span-4 header">Date de début</div>
            <div class="cell span-4 header">Date de fin</div>
            <div class="cell span-4 header">Durée</div>
          </div>
          <div class="row">
            <div class="cell span-4">${startDate}</div>
            <div class="cell span-4">${endDate}</div>
            <div class="cell span-4"><strong>${rentalDays} jour${rentalDays > 1 ? 's' : ''}</strong></div>
          </div>
        </div>
      </section>

      <section>
        <div class="title">
          <span class="dot"></span>
          <h2>Récapitulatif de la location</h2>
        </div>
        <div class="card">
          <div class="row">
            <div class="cell header span-6">Tarif</div>
            <div class="cell header span-6">Cautions</div>
          </div>
          <div class="row">
            <div class="cell span-6">
              <div class="pill">
                <strong>${formatCurrency(reservation.estimated_price || 0, currency)}</strong>
              </div>
            </div>
            <div class="cell span-6">
              <div class="pill">
                Départ: <strong>${formatCurrency(vehicle.deposit || 0, currency)}</strong>
                ${vehicle.deposit_rsv ? `<br>RSV: <strong>${formatCurrency(vehicle.deposit_rsv, currency)}</strong>` : ''}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="title"><span class="dot"></span><h2>État du véhicule au départ</h2></div>
        <div class="grid-2">
          <div class="pill">
            <div style="color:var(--muted);font-size:12px;margin-bottom:4px">📊 Kilométrage</div>
            <strong style="font-size:20px">${checkInData.mileage_start?.toLocaleString() || 0} km</strong>
          </div>
          <div class="pill">
            <div style="color:var(--muted);font-size:12px;margin-bottom:4px">⛽ Niveau de carburant</div>
            <strong style="font-size:20px">${checkInData.fuel_level || 'Non renseigné'}</strong>
          </div>
        </div>
      </section>

      ${photosHTML}

      ${damagesHTML}

      <section>
        <div class="title"><span class="dot"></span><h2>Signatures</h2></div>
        <div class="signs">
          <div class="sign">
            <h3>Signature du loueur</h3>
            <div class="name">${companyName}</div>
            <div class="sigbox">
              ${ownerSignatureHTML}
            </div>
          </div>
          <div class="sign">
            <h3>Signature du locataire</h3>
            <div class="name">${client?.name || ''}</div>
            <div class="sigbox">
              ${clientSignatureHTML}
            </div>
          </div>
        </div>
        <p style="margin-top:16px;color:var(--muted);font-size:12px;text-align:center">
          Fait à ${companyInfo || '________________'}, le ${checkInDate}
        </p>
      </section>

      <footer class="foot">
        <p>
          <strong>${companyName}</strong>
          ${organization?.siret ? ' • SIRET : ' + organization.siret : ''}
          ${organization?.address ? ' • ' + organization.address : ''}
        </p>
        <p style="margin-top:8px">
          Document généré automatiquement le ${format(new Date(), "d MMMM yyyy à HH:mm", { locale: fr })}
        </p>
      </footer>
    </div>
  </div>
  <script>
    // Si window.close() ne fonctionne pas, proposer de revenir en arrière
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        // Attempt to close the window normally
        let closedSuccessfully = false;
        try {
          if (window.opener && !window.opener.closed) { // Check if opened by another window
            window.close();
            closedSuccessfully = true;
          } else if (window.history.length === 1 && window.history.state === null) {
            // This is likely the first page in this tab, window.close() might work directly
            // or if it's a popup opened by script.
             window.close();
             closedSuccessfully = true;
          } else {
            // Fallback for cases where window.close() is restricted
             window.close(); // Try closing anyway, browser might allow it
             closedSuccessfully = true; // Assume success or fall through to message
          }
        } catch (error) {
          // Do nothing, closedSuccessfully remains false
        }

        if (!closedSuccessfully) {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            alert('Utilisez le bouton retour de votre navigateur pour fermer ce document.');
          }
        }
      });
    }
  </script>
</body>
</html>`;
};

export const downloadCheckInReport = async (reservation, vehicle, client, organization, checkIn) => {
  const html = generateCheckInReportHTML(reservation, vehicle, client, organization, checkIn);

  // CORRECTION: Ouvrir dans le navigateur au lieu de télécharger
  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  } else {
    alert("Veuillez autoriser les pop-ups pour visualiser l'état des lieux");
  }
};
