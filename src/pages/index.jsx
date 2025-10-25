import Layout from "./Layout.jsx";

import Vehicles from "./Vehicles";

import Clients from "./Clients";

import Reservations from "./Reservations";

import Settings from "./Settings";

import Subscription from "./Subscription";

import CheckIn from "./CheckIn";

import CheckOut from "./CheckOut";

import VehicleDetail from "./VehicleDetail";

import ViewCheckIn from "./ViewCheckIn";

import ViewCheckOut from "./ViewCheckOut";

import FixedCharges from "./FixedCharges";

import ClientDetail from "./ClientDetail";

import Onboarding from "./Onboarding";

import ViewContract from "./ViewContract";

import Auth from "./Auth";

import Dashboard from "./Dashboard";

import RentDetail from "./RentDetail";

import rent from "./rent";

import Garage from "./Garage";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Vehicles: Vehicles,
    
    Clients: Clients,
    
    Reservations: Reservations,
    
    Settings: Settings,
    
    Subscription: Subscription,
    
    CheckIn: CheckIn,
    
    CheckOut: CheckOut,
    
    VehicleDetail: VehicleDetail,
    
    ViewCheckIn: ViewCheckIn,
    
    ViewCheckOut: ViewCheckOut,
    
    FixedCharges: FixedCharges,
    
    ClientDetail: ClientDetail,
    
    Onboarding: Onboarding,
    
    ViewContract: ViewContract,
    
    Auth: Auth,
    
    Dashboard: Dashboard,
    
    RentDetail: RentDetail,
    
    rent: rent,
    
    Garage: Garage,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Vehicles />} />
                
                
                <Route path="/Vehicles" element={<Vehicles />} />
                
                <Route path="/Clients" element={<Clients />} />
                
                <Route path="/Reservations" element={<Reservations />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Subscription" element={<Subscription />} />
                
                <Route path="/CheckIn" element={<CheckIn />} />
                
                <Route path="/CheckOut" element={<CheckOut />} />
                
                <Route path="/VehicleDetail" element={<VehicleDetail />} />
                
                <Route path="/ViewCheckIn" element={<ViewCheckIn />} />
                
                <Route path="/ViewCheckOut" element={<ViewCheckOut />} />
                
                <Route path="/FixedCharges" element={<FixedCharges />} />
                
                <Route path="/ClientDetail" element={<ClientDetail />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/ViewContract" element={<ViewContract />} />
                
                <Route path="/Auth" element={<Auth />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/RentDetail" element={<RentDetail />} />
                
                <Route path="/rent" element={<rent />} />
                
                <Route path="/Garage" element={<Garage />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}