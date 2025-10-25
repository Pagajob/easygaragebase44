
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency, getCurrencySymbol } from "../utils/formatters";

const EASYGARAGE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68da84aca844db7bb5ada5ae/7786828b1_G.png";

export const generateLoanContract = (reservation, vehicle, client, organization) => {
  const currency = organization?.currency || 'EUR';
  const currencySymbol = getCurrencySymbol(currency);

  const startDate = format(parseISO(reservation.start_date), "EEEE d MMMM yyyy", { locale: fr });
  const endDate = format(parseISO(reservation.end_date), "EEEE d MMMM yyyy", { locale: fr });
  const startTime = reservation.start_time || "18:00";
  const endTime = reservation.end_time || "18:00";

  const startDateTime = parseISO(`${reservation.start_date}T${startTime}`);
  const endDateTime = parseISO(`${reservation.end_date}T${endTime}`);
  const days = Math.max(1, differenceInDays(endDateTime, startDateTime));

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Contrat de prêt – ${organization?.name || 'EasyGarage'}</title>
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
      --success:#10b981;
    }
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:var(--bg);color:#111;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji";}
    @page{size:A4;margin:18mm 15mm}
    .page{max-width:850px;margin:24px auto;padding:0 16px}
    .doc{background:white;border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(17,24,39,.06)}
    .header{display:flex;align-items:center;justify-content:space-between;padding:28px 32px;border-bottom:1px solid var(--border);background:linear-gradient(180deg,#f0fdf4,transparent)}
    .brand{display:flex;gap:14px;align-items:center}
    .logo{width:52px;height:52px;border-radius:12px;object-fit:cover;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    .brand h1{margin:0;font-size:22px;line-height:1.2;color:var(--brand)}
    .brand small{display:block;color:var(--muted);font-weight:500;font-size:13px}
    .meta{text-align:right}
    .badge{display:inline-block;background:#d1fae5;padding:6px 12px;border-radius:999px;color:#065f46;font-size:13px;font-weight:600;border:1px solid #6ee7b7}
    .meta p{margin:.35rem 0 0;color:var(--muted);font-size:12px}
    section{padding:20px 32px}
    .title{display:flex;align-items:center;gap:10px;margin:8px 0 14px}
    .title .dot{width:10px;height:10px;border-radius:999px;background:var(--success);box-shadow:0 0 0 3px rgba(16,185,129,.15)}
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
    .info-box{background:#d1fae5;border:2px solid #6ee7b7;border-radius:12px;padding:16px;margin:16px 0}
    .info-box h3{margin:0 0 8px;color:#065f46;font-size:16px}
    .info-box p{margin:4px 0;color:#047857;font-size:14px}
    .signs{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:8px}
    .sign{border:1px solid var(--border);border-radius:14px;padding:16px 18px;min-height:140px;background:#fff}
    .sign h3{margin:0 0 8px;font-size:14px;color:var(--muted);font-weight:600}
    .sign .name{font-weight:700;color:var(--brand);font-size:15px}
    .sign .sigbox{margin-top:16px;min-height:80px;border-top:1px dashed var(--border);padding-top:12px;display:flex;align-items:center;justify-content:center}
    .sign img{max-width:200px;max-height:70px}
    .sign.signed{border-color:#10b981;background:#f0fdf4}
    .sign.signed h3{color:#059669}
    .foot{padding:16px;color:var(--muted);text-align:center;border-top:1px solid var(--border);font-size:12px;background:#fafafa}
    details{border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin:8px 0;background:#fff}
    summary{cursor:pointer;font-weight:700;color:#0f172a;font-size:14px}
    details p{margin:8px 0 0;color:#374151;font-size:13px;line-height:1.6}
    @media print{
      .page{max-width:auto;margin:0;padding:0}
      .doc{border:none;box-shadow:none;border-radius:0}
    }
    @media(max-width:740px){
      .header{flex-direction:column;gap:16px;text-align:center}
      .meta{text-align:center}
      .grid-2,.signs{grid-template-columns:1fr}
      .brand{flex-direction:column;text-align:center}
    }
    
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
  </style>
</head>
<body>
  <!-- NEW: Bouton de fermeture -->
  <button class="close-btn" onclick="window.close()">✕</button>
  
  <div class="page">
    <div class="doc">
      <header class="header">
        <div class="brand">
          <img src="${organization?.logo_url || EASYGARAGE_LOGO}" alt="Logo" class="logo" onerror="this.src='${EASYGARAGE_LOGO}'" />
          <div>
            <h1>${organization?.name || 'EasyGarage'}</h1>
            <small>Contrat de prêt</small>
          </div>
        </div>
        <div class="meta">
          <div class="badge">✓ PRÊT GRATUIT</div>
          <p>Émis le ${format(new Date(), "d MMMM yyyy", { locale: fr })}</p>
        </div>
      </header>

      <section>
        <div class="title"><span class="dot"></span><h2>Emprunteur</h2></div>
        <div class="card">
          <div class="row">
            <div class="cell header span-6">Nom complet</div>
            <div class="cell header span-6">Contact</div>
          </div>
          <div class="row">
            <div class="cell span-6">${client.name}</div>
            <div class="cell span-6">${client.email || ''}<br/>${client.phone || ''}</div>
          </div>
          ${client.address ? `
          <div class="row">
            <div class="cell header span-12">Adresse</div>
          </div>
          <div class="row">
            <div class="cell span-12">${client.address}</div>
          </div>
          ` : ''}
          ${client.license_number ? `
          <div class="row">
            <div class="cell header span-6">Numéro de permis</div>
            <div class="cell header span-6">Date d'obtention</div>
          </div>
          <div class="row">
            <div class="cell span-6">${client.license_number}</div>
            <div class="cell span-6">${client.license_date ? format(parseISO(client.license_date), "d MMMM yyyy", { locale: fr }) : 'Non renseignée'}</div>
          </div>
          ` : ''}
        </div>
      </section>

      <section>
        <div class="title"><span class="dot"></span><h2>Véhicule prêté</h2></div>
        <div class="card">
          <div class="row">
            <div class="cell header span-6">Véhicule</div>
            <div class="cell header span-6">Immatriculation</div>
          </div>
          <div class="row">
            <div class="cell span-6"><strong>${vehicle.make} ${vehicle.model}</strong></div>
            <div class="cell span-6"><strong>${vehicle.plate}</strong></div>
          </div>
          <div class="row">
            <div class="cell header span-4">Année</div>
            <div class="cell header span-4">Motorisation</div>
            <div class="cell header span-4">VIN</div>
          </div>
          <div class="row">
            <div class="cell span-4">${vehicle.year || '—'}</div>
            <div class="cell span-4">${vehicle.fuel_type || '—'}</div>
            <div class="cell span-4">${vehicle.vin || '—'}</div>
          </div>
        </div>
      </section>

      <section>
        <div class="title"><span class="dot"></span><h2>Période de prêt</h2></div>
        <div class="card">
          <div class="row">
            <div class="cell header span-6">Départ</div>
            <div class="cell header span-6">Retour prévu</div>
          </div>
          <div class="row">
            <div class="cell span-6">
              <strong>${startDate}</strong><br/>
              à ${startTime}
              ${reservation.pickup_location ? `<br/><span class="muted">📍 ${reservation.pickup_location}</span>` : ''}
            </div>
            <div class="cell span-6">
              <strong>${endDate}</strong><br/>
              à ${endTime}
              ${reservation.return_location ? `<br/><span class="muted">📍 ${reservation.return_location}</span>` : ''}
            </div>
          </div>
          <div class="row">
            <div class="cell header span-12">Durée totale</div>
          </div>
          <div class="row">
            <div class="cell span-12"><strong>${days} jour${days > 1 ? 's' : ''}</strong></div>
          </div>
        </div>
      </section>

      <section>
        <div class="info-box">
          <h3>ℹ️ Informations importantes</h3>
          <p><strong>Nature du prêt :</strong> Ce véhicule est prêté gratuitement, sans contrepartie financière.</p>
          <p><strong>Responsabilité :</strong> L'emprunteur est responsable du véhicule pendant toute la durée du prêt.</p>
          <p><strong>Carburant :</strong> Le véhicule doit être rendu avec le même niveau de carburant.</p>
          <p><strong>Dommages :</strong> Tout dommage doit être signalé immédiatement au prêteur.</p>
          <p><strong>Usage :</strong> Le véhicule ne peut pas être sous-loué ou prêté à un tiers sans accord préalable.</p>
          <p><strong>Kilométrage :</strong> ${reservation.unlimited_km ? 'Kilométrage illimité' : `${reservation.km_included || 0} km inclus pour la période`}</p>
        </div>
      </section>

      ${vehicle.damages && vehicle.damages.length > 0 ? `
      <section>
        <div class="title"><span class="dot"></span><h2>État du véhicule connu</h2></div>
        <details>
          <summary>Dommages existants (${vehicle.damages.length})</summary>
          ${vehicle.damages.map(damage => `
            <p>• <strong>${damage.type}</strong> – ${damage.location} : ${damage.description} 
            <span class="muted">(${damage.severity})</span></p>
          `).join('')}
        </details>
      </section>
      ` : ''}

      ${reservation.notes ? `
      <section>
        <div class="title"><span class="dot"></span><h2>Notes complémentaires</h2></div>
        <div class="pill">${reservation.notes}</div>
      </section>
      ` : ''}

      <section>
        <div class="title"><span class="dot"></span><h2>Signatures</h2></div>
        <div class="signs">
          <div class="sign ${reservation.owner_signature ? 'signed' : ''}">
            <h3>Signature du prêteur</h3>
            <div class="name">${organization?.name || 'Prêteur'}</div>
            <div class="sigbox">
              ${reservation.owner_signature ? 
                `<img src="${reservation.owner_signature}" alt="Signature" />` :
                '<span class="muted">En attente</span>'
              }
            </div>
            ${reservation.signed_at ? `<p class="muted" style="margin-top:8px;font-size:12px">${format(parseISO(reservation.signed_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>` : ''}
          </div>

          <div class="sign ${reservation.client_signature ? 'signed' : ''}">
            <h3>Signature de l'emprunteur</h3>
            <div class="name">${client.name}</div>
            <div class="sigbox">
              ${reservation.client_signature ? 
                `<img src="${reservation.client_signature}" alt="Signature" />` :
                '<span class="muted">En attente</span>'
              }
            </div>
            ${reservation.signed_at ? `<p class="muted" style="margin-top:8px;font-size:12px">${format(parseISO(reservation.signed_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>` : ''}
          </div>
        </div>
      </section>

      <footer class="foot">
        <p>Document généré par ${organization?.name || 'EasyGarage'} • ${format(new Date(), "d MMMM yyyy", { locale: fr })}</p>
        ${organization?.address ? `<p>${organization.address}</p>` : ''}
        ${organization?.siret ? `<p>SIRET : ${organization.siret}</p>` : ''}
      </footer>
    </div>
  </div>
  
  <script>
    // Si window.close() ne fonctionne pas (certains navigateurs bloquent), proposer de revenir en arrière
    document.querySelector('.close-btn').addEventListener('click', function(e) {
      if (!window.close()) {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          alert('Utilisez le bouton retour de votre navigateur pour fermer ce contrat');
        }
      }
    });
  </script>
</body>
</html>
  `;
};

export default generateLoanContract;
