
import { format, parseISO, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency, getCurrencySymbol } from "../utils/formatters";

const EASYGARAGE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68da84aca844db7bb5ada5ae/478ef86e1_Icon-macOS-Default-1024x10242x.png";

export const generateCheckOutReportHTML = (reservation, vehicle, client, organization, checkIn, checkOutData) => {
  const logoUrl = organization?.logo_url || EASYGARAGE_LOGO;
  const companyName = organization?.name || "EasyGarage";
  const companyInfo = organization?.address || "Service de location de véhicules";
  
  const checkOutDateTime = format(parseISO(checkOutData.performed_at), "d MMMM yyyy à HH:mm", { locale: fr });
  const startDate = format(parseISO(reservation.start_date), "d MMMM yyyy", { locale: fr });
  const endDate = format(parseISO(reservation.end_date), "d MMMM yyyy", { locale: fr });
  const contractNumber = `EDL-OUT-${reservation.id.slice(-8).toUpperCase()}`;
  
  const currency = organization?.currency || 'EUR';
  const currencySymbol = getCurrencySymbol(currency);

  // CORRECTION: 24h = 1 jour, 24h01 = 2 jours
  const startDateTime = parseISO(`${reservation.start_date}T${reservation.start_time || '18:00'}`);
  const endDateTime = parseISO(`${reservation.end_date}T${reservation.end_time || '18:00'}`);
  const hours = differenceInHours(endDateTime, startDateTime);
  const rentalDays = hours > 0 ? Math.ceil(hours / 24) : 1;
  
  const kmStart = checkIn?.mileage_start || 0;
  const kmEnd = checkOutData.mileage_end || 0;
  const kmDifference = kmEnd - kmStart;
  
  const includedKm = rentalDays * (vehicle?.daily_km_included || 200);
  const extraKm = vehicle?.unlimited_km ? 0 : Math.max(0, kmDifference - includedKm);
  const extraKmCost = extraKm * (vehicle?.price_per_extra_km || 1.00);

  // Calculate total cost for the financial summary
  let totalCost = reservation.estimated_price || 0;
  totalCost += extraKmCost;
  if (checkOutData.additionalFees && checkOutData.additionalFees.length > 0) {
    totalCost += checkOutData.additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
  }

  // Générer les photos HTML
  let photosHTML = '';
  if (checkOutData.photos && checkOutData.photos.length > 0) {
    const photosContent = checkOutData.photos.map(photo => {
      const label = photo.label ? `<div class="photo-label">${photo.label}</div>` : '';
      return `
        <div class="photo-item">
          <img src="${photo.url}" alt="${photo.label || 'Photo'}" crossorigin="anonymous" />
          ${label}
        </div>
      `;
    }).join('');

    photosHTML = `
      <section>
        <div class="title"><span class="dot"></span><h2>Photos (${checkOutData.photos.length})</h2></div>
        <div class="photo-grid">
          ${photosContent}
        </div>
      </section>
    `;
  }

  // Générer les dégâts HTML
  let damagesHTML = '';
  if (checkOutData.damages && checkOutData.damages.length > 0) {
    const damagesContent = checkOutData.damages.map(damage => `
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
        <div class="title"><span class="dot"></span><h2>Nouveaux dégâts constatés (${checkOutData.damages.length})</h2></div>
        ${damagesContent}
      </section>
    `;
  }

  const ownerSignatureHTML = checkOutData.owner_signature 
    ? `<img src="${checkOutData.owner_signature}" alt="Signature loueur" crossorigin="anonymous" />` 
    : '<span style="color:var(--muted);font-size:12px">Non signée</span>';

  const clientSignatureHTML = checkOutData.client_signature 
    ? `<img src="${checkOutData.client_signature}" alt="Signature client" crossorigin="anonymous" />` 
    : '<span style="color:var(--muted);font-size:12px">Non signée</span>';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>État des lieux de retour – ${organization?.name || 'EasyGarage'}</title>
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
      --success:#10b981;
      --warning:#f59e0b;
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
    .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
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
    .totals{border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-top:12px}
    .totals .row{display:grid;grid-template-columns:2fr 1fr;gap:0;border-top:1px solid var(--border)}
    .totals .row:first-child{border-top:0}
    .totals .cell{padding:12px 14px;border-left:1px solid var(--border);font-size:14px}
    .totals .cell:first-child{border-left:0}
    .totals .label{background:#f8fafc;font-weight:700;color:#0f172a}
    .totals .highlight{background:#fef3c7;color:#92400e;font-weight:700}
    .totals .danger{background:#fee2e2;color:#991b1b;font-weight:700}
    .totals .total .cell{background:var(--accent);color:#fff;font-weight:700}
    .totals .cell.right { text-align: right; }
    .foot{padding:16px;color:var(--muted);text-align:center;border-top:1px solid var(--border);font-size:12px;background:#fafafa}

    /* NEW: Bouton de fermeture mobile */
    .close-btn {
      display: none; /* Hidden by default */
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
    
    .print-btn{position:fixed;bottom:20px;right:20px;padding:12px 24px;background:#0ea5e9;color:white;border:none;border-radius:999px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(14,165,233,.3);z-index:1000}
    .print-btn:hover{background:#0284c7}
    
    @media (max-width: 768px) {
      .close-btn {
        display: flex; /* Show only on mobile */
      }
    }
    
    @media print {
      .page{max-width:auto;margin:0;padding:0}
      .doc{border:none;box-shadow:none;border-radius:0}
      .print-btn, .close-btn {
        display: none !important;
      }
    }
    @media(max-width:740px){
      .header{flex-direction:column;gap:16px;text-align:center}
      .meta{text-align:center}
      .grid-2,.grid-3,.signs{grid-template-columns:1fr}
      .brand{flex-direction:column;text-align:center}
      .photo-grid{grid-template-columns:repeat(2,1fr)}
    }
  </style>
</head>
<body>
  <!-- NEW: Bouton de fermeture -->
  <button class="close-btn" onclick="window.close()">✕</button>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimer</button>
  <div class="page">
    <div class="doc">
      <header class="header">
        <div class="brand">
          <img src="${logoUrl}" alt="Logo" class="logo" crossorigin="anonymous" onerror="this.style.display='none'" />
          <div>
            <h1>État des lieux de retour</h1>
            <small>${companyName} – ${companyInfo}</small>
          </div>
        </div>
        <div class="meta">
          <span class="badge">N° : <strong>${contractNumber}</strong></span>
          <p>Effectué le : <strong>${checkOutDateTime}</strong></p>
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
        <div class="title"><span class="dot"></span><h2>Kilométrage</h2></div>
        <div class="totals">
          <div class="row">
            <div class="cell label">Kilométrage départ</div>
            <div class="cell">${kmStart.toLocaleString('fr-FR')} km</div>
          </div>
          <div class="row">
            <div class="cell label">Kilométrage retour</div>
            <div class="cell">${kmEnd.toLocaleString('fr-FR')} km</div>
          </div>
          <div class="row">
            <div class="cell label"><strong>Distance parcourue</strong></div>
            <div class="cell"><strong>${kmDifference.toLocaleString('fr-FR')} km</strong></div>
          </div>
          ${!vehicle?.unlimited_km ? `
          <div class="row">
            <div class="cell label">Kilométrage inclus (${rentalDays} jour${rentalDays > 1 ? 's' : ''})</div>
            <div class="cell">${includedKm.toLocaleString('fr-FR')} km</div>
          </div>
          ${extraKm > 0 ? `
          <div class="row">
            <div class="cell danger">⚠️ Kilométrage excédentaire</div>
            <div class="cell danger"><strong>${extraKm.toLocaleString('fr-FR')} km</strong></div>
          </div>
          <div class="row">
            <div class="cell label">Tarif km supplémentaire</div>
            <div class="cell">${formatCurrency(vehicle?.price_per_extra_km || 1.00, currency)}/km</div>
          </div>
          <div class="row">
            <div class="cell highlight">💰 Total km supplémentaires</div>
            <div class="cell highlight"><strong>${formatCurrency(extraKmCost, currency)}</strong></div>
          </div>
          ` : ''}
          ` : `
          <div class="row">
            <div class="cell label">Kilométrage</div>
            <div class="cell"><span style="color:var(--success)">✓ Illimité</span></div>
          </div>
          `}
        </div>
      </section>

      <section>
        <div class="title">
          <span class="dot"></span>
          <h2>Récapitulatif financier</h2>
        </div>
        <div class="totals">
          <div class="row">
            <div class="cell label">Tarif location estimé</div>
            <div class="cell right">${formatCurrency(reservation.estimated_price || 0, currency)}</div>
          </div>
          ${extraKm > 0 ? `
          <div class="row">
            <div class="cell label">Kilométrage supplémentaire (${extraKm.toLocaleString('fr-FR')} km × ${formatCurrency(vehicle?.price_per_extra_km || 1, currency)}/km)</div>
            <div class="cell right highlight">${formatCurrency(extraKmCost, currency)}</div>
          </div>
          ` : ''}
          ${checkOutData.additionalFees && checkOutData.additionalFees.length > 0 ? checkOutData.additionalFees.map(fee => `
          <div class="row">
            <div class="cell label">${fee.label}</div>
            <div class="cell right">${formatCurrency(fee.amount, currency)}</div>
          </div>
          `).join('') : ''}
          <div class="row total">
            <div class="cell label"><strong>TOTAL PRÉVU</strong></div>
            <div class="cell right"><strong>${formatCurrency(totalCost, currency)}</strong></div>
          </div>
        </div>
      </section>

      <section>
        <div class="title"><span class="dot"></span><h2>Carburant</h2></div>
        <div class="grid-2">
          <div class="pill">
            <div style="color:var(--muted);font-size:12px;margin-bottom:4px">⛽ Départ</div>
            <strong style="font-size:20px">${checkIn?.fuel_level || 'Non renseigné'}</strong>
          </div>
          <div class="pill">
            <div style="color:var(--muted);font-size:12px;margin-bottom:4px">⛽ Retour</div>
            <strong style="font-size:20px">${checkOutData.fuel_level || 'Non renseigné'}</strong>
          </div>
        </div>
        ${checkIn?.fuel_level !== checkOutData.fuel_level ? `
        <div style="margin-top:12px;background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:12px;display:flex;gap:12px">
          <span style="font-size:20px">⚠️</span>
          <div>
            <strong style="color:#991b1b">Niveau de carburant différent</strong>
            <p style="margin:4px 0 0;font-size:13px;color:#991b1b">Le véhicule n'a pas été restitué avec le même niveau de carburant qu'au départ.</p>
          </div>
        </div>
        ` : ''}
      </section>

      ${damagesHTML}

      ${photosHTML}

      ${checkOutData.notes ? `
      <section>
        <div class="title"><span class="dot"></span><h2>Notes</h2></div>
        <div class="pill">${checkOutData.notes}</div>
      </section>
      ` : ''}

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
          Fait à ${companyInfo || '________________'}, le ${checkOutDateTime}
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
        try {
          if (!window.close()) {
            // If window.close() returns false (meaning it failed or wasn't allowed)
            // Check if there's history to go back to
            if (window.history.length > 1) {
              window.history.back();
            } else {
              // If no history, prompt the user
              alert('Utilisez le bouton retour de votre navigateur pour fermer ce document');
            }
          }
        } catch (error) {
          // Catch any security errors that might prevent window.close()
          if (window.history.length > 1) {
            window.history.back();
          } else {
            alert('Utilisez le bouton retour de votre navigateur pour fermer ce document');
          }
        }
      });
    }
  </script>
</body>
</html>`;
};
