
import { base44 } from "@/api/base44Client";
import { generateLoanContract } from "./LoanContractGenerator";
import { filterByOrganization } from "../utils/multiTenant";
import { differenceInHours, parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency, getCurrencySymbol } from "../utils/formatters";

const EASYGARAGE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68da84aca844db7bb5ada5ae/478ef86e1_Icon-macOS-Default-1024x10242x.png";

export const generateContractHTML = (reservation, vehicle, client, organization, additionalFees = []) => {
  const startDate = format(parseISO(reservation.start_date), "dd/MM/yyyy", { locale: fr });
  const endDate = format(parseISO(reservation.end_date), "dd/MM/yyyy", { locale: fr });
  const today = format(new Date(), "dd/MM/yyyy", { locale: fr });

  const currency = organization?.currency || 'EUR';
  const currencySymbol = getCurrencySymbol(currency);

  // Calculer la durée de location
  const startDateTime = parseISO(`${reservation.start_date}T${reservation.start_time || '18:00'}`);
  const endDateTime = parseISO(`${reservation.end_date}T${reservation.end_time || '18:00'}`);
  const hours = differenceInHours(endDateTime, startDateTime);
  const days = Math.max(1, Math.ceil(hours / 24));

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Contrat de location – ${organization?.name || 'EasyGarage'}</title>
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
    html,body{margin:0;padding:0;background:var(--bg);color:#111;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji";}
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
    .span-8{grid-column:span 8}
    .span-12{grid-column:1 / -1}
    .muted{color:var(--muted)}
    .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .pill{background:var(--pill);border:1px dashed var(--border);color:#0f172a;border-radius:12px;padding:12px 14px;font-size:14px}
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
    details ul{margin:8px 0 0;padding-left:20px;color:#374151;font-size:13px;line-height:1.6}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th,td{border:1px solid var(--border);padding:10px 12px;text-align:left;font-size:13px}
    th{background:#f8fafc;font-weight:600}
    .no-print{display:block}
    @media print{
      .page{max-width:auto;margin:0;padding:0}
      .doc{border:none;box-shadow:none;border-radius:0}
      .no-print{display:none}
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
      background: var(--danger);
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 24px;
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
  <button class="close-btn" aria-label="Fermer le contrat">✕</button>
  
  <div class="page">
    <div class="doc">
      <header class="header">
        <div class="brand">
          ${organization?.logo_url ? 
            `<img src="${organization.logo_url}" alt="Logo" class="logo" onerror="this.style.display='none'" />` : 
            ''
          }
          <div>
            <h1>Contrat de location</h1>
            <small>${organization?.name || 'EasyGarage'}${organization?.address ? ` – ${organization.address}` : ''}</small>
          </div>
        </div>
        <div class="meta">
          <span class="badge">N° contrat : <strong>${reservation.id?.substring(0, 8).toUpperCase()}</strong></span>
          <p>Émis le : <strong>${today}</strong></p>
        </div>
      </header>

      <section>
        <div class="title"><span class="dot"></span><h2>Client & Conducteurs</h2></div>
        <div class="card">
          <div class="row">
            <div class="cell span-6 header">Nom</div>
            <div class="cell span-6 header">Email</div>
          </div>
          <div class="row">
            <div class="cell span-6">${client?.name || 'N/A'}</div>
            <div class="cell span-6">${client?.email || 'N/A'}</div>
          </div>
          <div class="row">
            ${client?.phone ? `<div class="cell span-4 header">Téléphone</div>` : ''}
            ${client?.address ? `<div class="cell span-${client?.phone && client?.company_name ? '4' : client?.phone || client?.company_name ? '6' : '12'} header">Adresse</div>` : ''}
            ${client?.company_name ? `<div class="cell span-${client?.phone && client?.address ? '4' : client?.phone || client?.address ? '6' : '12'} header">Société</div>` : ''}
          </div>
          <div class="row">
            ${client?.phone ? `<div class="cell span-4">${client.phone}</div>` : ''}
            ${client?.address ? `<div class="cell span-${client?.phone && client?.company_name ? '4' : client?.phone || client?.company_name ? '6' : '12'}">${client.address}</div>` : ''}
            ${client?.company_name ? `<div class="cell span-${client?.phone && client?.address ? '4' : client?.phone || client?.address ? '6' : '12'}">${client.company_name}</div>` : ''}
          </div>
          ${client?.license_number || client?.id_document ? `
          <div class="row">
            ${client?.license_number ? `<div class="cell span-${client?.id_document ? '6' : '12'} header">N° Permis</div>` : ''}
            ${client?.id_document ? `<div class="cell span-${client?.license_number ? '6' : '12'} header">Pièce d'identité</div>` : ''}
          </div>
          <div class="row">
            ${client?.license_number ? `<div class="cell span-${client?.id_document ? '6' : '12'}">${client.license_number}${client?.license_date ? ` (${format(parseISO(client.license_date), "dd/MM/yyyy", { locale: fr })})` : ''}</div>` : ''}
            ${client?.id_document ? `<div class="cell span-${client?.license_number ? '6' : '12'}">${client.id_document}</div>` : ''}
          </div>
          ` : ''}
        </div>
      </section>

      <section>
        <div class="title"><span class="dot"></span><h2>Véhicule</h2></div>
        <div class="card">
          <div class="row">
            <div class="cell span-12 header">Marque & Modèle</div>
          </div>
          <div class="row">
            <div class="cell span-12">${vehicle?.make || ''} ${vehicle?.model || ''}${vehicle?.year ? ` (${vehicle.year})` : ''}</div>
          </div>
          <div class="row">
            <div class="cell span-3 header">Immatriculation</div>
            ${vehicle?.fuel_type ? `<div class="cell span-3 header">Carburant</div>` : ''}
            ${vehicle?.vin ? `<div class="cell span-${vehicle?.fuel_type ? '6' : '9'} header">VIN</div>` : ''}
          </div>
          <div class="row">
            <div class="cell span-3">${vehicle?.plate || 'N/A'}</div>
            ${vehicle?.fuel_type ? `<div class="cell span-3">${vehicle.fuel_type}</div>` : ''}
            ${vehicle?.vin ? `<div class="cell span-${vehicle?.fuel_type ? '6' : '9'}">${vehicle.vin}</div>` : ''}
          </div>
        </div>
      </section>

      <section>
        <div class="title"><span class="dot"></span><h2>Période de location</h2></div>
        <div class="card">
          <div class="row">
            <div class="cell span-6 header">Début</div>
            <div class="cell span-6 header">Fin</div>
          </div>
          <div class="row">
            <div class="cell span-6">${startDate}${reservation.start_time ? ` à ${reservation.start_time}` : ''}</div>
            <div class="cell span-6">${endDate}${reservation.end_time ? ` à ${reservation.end_time}` : ''}</div>
          </div>
          ${reservation.pickup_location || reservation.return_location ? `
          <div class="row">
            ${reservation.pickup_location ? `<div class="cell span-${reservation.return_location ? '6' : '12'} header">Lieu de prise en charge</div>` : ''}
            ${reservation.return_location ? `<div class="cell span-${reservation.pickup_location ? '6' : '12'} header">Lieu de retour</div>` : ''}
          </div>
          <div class="row">
            ${reservation.pickup_location ? `<div class="cell span-${reservation.return_location ? '6' : '12'}">${reservation.pickup_location}</div>` : ''}
            ${reservation.return_location ? `<div class="cell span-${reservation.pickup_location ? '6' : '12'}">${reservation.return_location}</div>` : ''}
          </div>
          ` : ''}
          <div class="row">
            <div class="cell span-12 header">Durée totale</div>
          </div>
          <div class="row">
            <div class="cell span-12">${days} jour${days > 1 ? 's' : ''} (${hours}h)</div>
          </div>
        </div>
      </section>

      <section>
        <div class="title"><span class="dot"></span><h2>Tarification & Conditions</h2></div>
        <div class="grid-2">
          <div class="pill">
            <strong>Prix de location</strong><br/>
            <span style="font-size:20px;font-weight:700;color:var(--accent)">${formatCurrency(reservation.estimated_price || 0, currency)}</span>
          </div>
          ${vehicle?.deposit ? `
          <div class="pill">
            <strong>Caution</strong><br/>
            <span style="font-size:20px;font-weight:700;color:var(--brand)">${formatCurrency(vehicle.deposit, currency)}</span>
          </div>
          ` : ''}
        </div>

        <div class="card" style="margin-top:14px">
          <div class="row">
            <div class="cell span-${vehicle?.unlimited_km ? '12' : '6'} header">Kilométrage</div>
            ${!vehicle?.unlimited_km ? `<div class="cell span-6 header">Prix km supplémentaire</div>` : ''}
          </div>
          <div class="row">
            <div class="cell span-${vehicle?.unlimited_km ? '12' : '6'}">
              ${vehicle?.unlimited_km ? 
                '<strong style="color:#10b981">✓ Kilométrage illimité</strong>' : 
                `${vehicle?.daily_km_included || 0} km/jour inclus (${(vehicle?.daily_km_included || 0) * days} km pour ${days} jour${days > 1 ? 's' : ''})`
              }
            </div>
            ${!vehicle?.unlimited_km ? `<div class="cell span-6">${formatCurrency(vehicle?.price_per_extra_km || 0, currency)}/km</div>` : ''}
          </div>
        </div>

        ${vehicle?.deposit || vehicle?.deposit_rsv ? `
        <div class="card" style="margin-top:14px">
          <div class="row">
            <div class="cell span-6 header">Caution déposée</div>
            <div class="cell span-6 header">${vehicle?.deposit_rsv ? 'Franchise RSV' : 'Mode de restitution'}</div>
          </div>
          <div class="row">
            <div class="cell span-6">${formatCurrency(vehicle?.deposit || 0, currency)}</div>
            <div class="cell span-6">${vehicle?.deposit_rsv ? formatCurrency(vehicle.deposit_rsv, currency) : 'Restitution sous 7 jours ouvrés si aucun dommage'}</div>
          </div>
        </div>
        ` : ''}

        ${vehicle?.min_driver_age || vehicle?.min_license_years ? `
        <div class="card" style="margin-top:14px">
          <div class="row">
            ${vehicle?.min_driver_age ? `<div class="cell span-${vehicle?.min_license_years ? '6' : '12'} header">Âge minimum du conducteur</div>` : ''}
            ${vehicle?.min_license_years ? `<div class="cell span-${vehicle?.min_driver_age ? '6' : '12'} header">Permis requis depuis</div>` : ''}
          </div>
          <div class="row">
            ${vehicle?.min_driver_age ? `<div class="cell span-${vehicle?.min_license_years ? '6' : '12'}">${vehicle.min_driver_age} ans</div>` : ''}
            ${vehicle?.min_license_years ? `<div class="cell span-${vehicle?.min_driver_age ? '6' : '12'}">${vehicle.min_license_years} an${vehicle.min_license_years > 1 ? 's' : ''}</div>` : ''}
          </div>
        </div>
        ` : ''}
      </section>

      ${additionalFees && additionalFees.length > 0 ? `
      <section>
        <div class="title"><span class="dot"></span><h2>Frais supplémentaires</h2></div>
        <table>
          <thead>
            <tr>
              <th>Frais</th>
              <th>Montant</th>
              <th>Unité</th>
            </tr>
          </thead>
          <tbody>
            ${additionalFees.filter(f => f.enabled).map(fee => `
            <tr>
              <td>${fee.label}</td>
              <td>${formatCurrency(fee.amount, currency)}</td>
              <td>${fee.unit || '-'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
      ` : ''}

      ${vehicle?.damages && vehicle.damages.length > 0 ? `
      <section>
        <div class="title"><span class="dot"></span><h2>État du véhicule au départ</h2></div>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Localisation</th>
              <th>Description</th>
              <th>Gravité</th>
            </tr>
          </thead>
          <tbody>
            ${vehicle.damages.map(damage => `
            <tr>
              <td>${damage.type || 'N/A'}</td>
              <td>${damage.location || 'N/A'}</td>
              <td>${damage.description || '-'}</td>
              <td>${damage.severity || '-'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
      ` : ''}

      <section>
        <div class="title"><span class="dot"></span><h2>Conditions Générales</h2></div>
        
        <details>
          <summary>Usage du véhicule</summary>
          <p>Le véhicule loué est strictement réservé à un usage privé et ne peut en aucun cas être utilisé pour :</p>
          <ul>
            <li>Le transport de marchandises ou de personnes à titre onéreux</li>
            <li>La participation à des compétitions sportives ou courses automobiles</li>
            <li>Le remorquage d'autres véhicules ou de caravanes</li>
            <li>Tout usage illégal ou contraire aux bonnes mœurs</li>
          </ul>
        </details>

        <details>
          <summary>Obligations du locataire</summary>
          <p>Le locataire s'engage à :</p>
          <ul>
            <li>Restituer le véhicule dans l'état dans lequel il l'a reçu, avec le même niveau de carburant</li>
            <li>Effectuer les contrôles quotidiens d'usage (huile, eau, pression des pneus)</li>
            <li>Ne pas sous-louer ou prêter le véhicule à des tiers</li>
            <li>Respecter le Code de la route et payer les amendes dont il serait redevable</li>
            <li>Informer immédiatement le loueur en cas d'accident, de panne ou de vol</li>
            <li>Ne pas conduire sous l'emprise d'alcool, de stupéfiants ou de médicaments altérant la vigilance</li>
          </ul>
        </details>

        <details>
          <summary>Assurance & Franchise</summary>
          <p>Le véhicule est assuré tous risques. En cas de dommages responsables, une franchise de ${formatCurrency(vehicle?.deposit || 1000, currency)} s'applique et sera retenue sur la caution.</p>
          ${vehicle?.deposit_rsv ? `
          <p><strong style="color:#dc2626">Franchise RSV (Rachat de Sinistre Véhicule) :</strong> En cas de véhicule irréparable, volé ou incendié, une franchise RSV de <strong>${formatCurrency(vehicle.deposit_rsv, currency)}</strong> s'applique. Cette franchise sera obligatoirement facturée.</p>
          ` : ''}
          <p><strong>Exclusions de garantie :</strong></p>
          <ul>
            <li>Dommages causés en état d'ivresse ou sous l'influence de stupéfiants</li>
            <li>Dommages résultant d'une utilisation non conforme aux présentes conditions</li>
            <li>Vol du véhicule en l'absence des clés ou si le véhicule n'était pas correctement verrouillé</li>
            <li>Dommages aux pneus, jantes, rétroviseurs, pare-brise et soubassement</li>
          </ul>
        </details>

        <details>
          <summary>Retard & Restitution</summary>
          <p>Tout retard dans la restitution du véhicule sans accord préalable du loueur entraînera une facturation supplémentaire de ${formatCurrency((reservation.estimated_price || 0) / days, currency)} par jour de retard, ainsi que des pénalités.</p>
          <p>Le véhicule doit être restitué avec le même niveau de carburant qu'à la prise en charge. Dans le cas contraire, des frais de remise à niveau seront facturés.</p>
        </details>

        <details>
          <summary>Résiliation & Annulation</summary>
          <p>Le loueur se réserve le droit de résilier le contrat sans préavis ni indemnité en cas de :</p>
          <ul>
            <li>Non-respect des obligations du locataire</li>
            <li>Utilisation frauduleuse du véhicule</li>
            <li>Défaut de paiement</li>
            <li>Mise en danger du véhicule ou de tiers</li>
          </ul>
          <p>En cas d'annulation par le locataire moins de 48h avant le début de la location, aucun remboursement ne sera effectué.</p>
        </details>

        <details>
          <summary>Protection des données personnelles</summary>
          <p>Les données personnelles collectées sont utilisées exclusivement dans le cadre de la location et conformément au RGPD. Le locataire dispose d'un droit d'accès, de rectification et de suppression de ses données.</p>
        </details>
      </section>

      <section>
        <div class="title"><span class="dot"></span><h2>Signatures</h2></div>
        <p style="color:var(--muted);font-size:13px;margin-bottom:14px">
          En signant ce contrat, le locataire et le loueur reconnaissent avoir lu et accepté l'ensemble des conditions générales ci-dessus.
        </p>
        <div class="signs">
          <div class="sign${reservation.owner_signature ? ' signed' : ''}">
            <h3>Signature du loueur</h3>
            <div class="name">${organization?.name || 'N/A'}</div>
            <div class="sigbox">
              ${reservation.owner_signature ? 
                `<img src="${reservation.owner_signature}" alt="Signature loueur" />` :
                '<span style="color:var(--muted);font-style:italic;font-size:13px">En attente de signature</span>'
              }
            </div>
          </div>
          <div class="sign${reservation.client_signature ? ' signed' : ''}">
            <h3>Signature du locataire</h3>
            <div class="name">${client?.name || 'N/A'}</div>
            <div class="sigbox">
              ${reservation.client_signature ? 
                `<img src="${reservation.client_signature}" alt="Signature client" />` :
                '<span style="color:var(--muted);font-style:italic;font-size:13px">En attente de signature</span>'
              }
            </div>
          </div>
        </div>
      </section>

      ${organization?.siret || organization?.address ? `
      <section>
        <div class="title"><span class="dot"></span><h2>Informations légales</h2></div>
        <div class="card">
          ${organization?.siret ? `
          <div class="row">
            <div class="cell span-12 header">SIRET</div>
          </div>
          <div class="row">
            <div class="cell span-12">${organization.siret}</div>
          </div>
          ` : ''}
          ${organization?.address ? `
          <div class="row">
            <div class="cell span-12 header">Adresse</div>
          </div>
          <div class="row">
            <div class="cell span-12">${organization.address}</div>
          </div>
          ` : ''}
        </div>
      </section>
      ` : ''}

      <footer class="foot">
        <p><strong>Document généré électroniquement le ${today}</strong></p>
        <p style="margin-top:6px">${organization?.name || 'N/A'}${organization?.address ? ` – ${organization.address}` : ''}${organization?.siret ? ` – SIRET: ${organization.siret}` : ''}</p>
        <p style="margin-top:6px;font-size:11px">Ce contrat est soumis au droit français. Tout litige sera porté devant les tribunaux compétents.</p>
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

export const generateContract = async (reservation, vehicle, client, organization) => {
  if (reservation.type === 'pret') {
    return generateLoanContract(reservation, vehicle, client, organization);
  }

  let additionalFees = [];
  try {
    additionalFees = await filterByOrganization('AdditionalFee');
  } catch (error) {
    console.error("Erreur lors du chargement des frais:", error);
  }

  const html = generateContractHTML(reservation, vehicle, client, organization, additionalFees);

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Contrat_${reservation.id.slice(-8)}_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
