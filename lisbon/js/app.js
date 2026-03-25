import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import firebaseConfig from './firebase-config.js';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-portugal-trip';

let app = null;
let db = null;

if (firebaseConfig && firebaseConfig.apiKey) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    } catch (e) {
        console.error("Firebase Initialization failed", e);
    }
}

// Core State
let currentDay = 0;
let currentSection = 'itinerary';
let hasInitialDataLoaded = false;
let tripStateUnsubscribe = null;
let eventNotes = {};
let userExpenses = {};

// Map State
let mapInstance = null;
let mapMarkers = [];

// UI Text Mapping
const sectionTitles = {
    'itinerary': 'Ultimate Trip Bible',
    'map': 'Interactive Route Map',
    'bookings': 'Bookings & Budget',
    'checklists': 'Preparation Checklists',
    'guide': 'Family Travel Guide'
};

// --- Reservation Data Hub ---
const reservationData = {
    flights: {
        airline: "TAP Air Portugal",
        pnr: "YXWAMH",
        passengers: [
            { name: "Mehul Agarwal", ticket: "...5211", seat: "14B (TP204)" },
            { name: "Nehal Agarwal", ticket: "...5209" },
            { name: "Aarit Agarwal", ticket: "...5210" },
            { name: "Keev Agarwal", ticket: "...5208" }
        ],
        schedule: [
            { date: "Thursday, March 26, 2026", flight: "TP204", route: "Newark (EWR) → Lisbon (LIS)", time: "12:55 AM -> 11:40 AM", label: "Arrival" },
            { date: "Saturday, April 4, 2026", flight: "TP1902", route: "Faro (FAO) → Lisbon (LIS)", time: "11:15 AM -> 12:10 PM", label: "Inter-Portugal" },
            { date: "Saturday, April 4, 2026", flight: "TP203", route: "Lisbon (LIS) → Newark (EWR)", time: "5:55 PM -> 9:00 PM", label: "Return" }
        ]
    },
    hotels: [
        {
            name: "Martinhal Lisbon Chiado Family Suites", location: "Lisbon",
            dates: "Mar 26 - Mar 31",
            bookingId: "DSR0254B8JUXF (PIN: 190696)",
            roomType: "1 BR Superior Deluxe Apt",
            checkIn: "3:00 PM (Early 11:45 AM requested)", checkOut: "12:00 PM",
            benefits: "Toddler Crib Added."
        },
        {
            name: "Vila Vita Parc Resort & Spa", location: "Algarve",
            dates: "Mar 31 - Apr 4",
            bookingId: "9076038703600 (Amex FHR)",
            roomType: "Family Suite (Oasis)",
            checkIn: "3:00 PM", checkOut: "4:00 PM (Late Checkout Guaranteed)",
            benefits: "$100 Credit, Breakfast, Room upgrade (if available)."
        }
    ],
    transport: {
        type: "Rental Car (Rent Car 4 Less via Zest)",
        pickup: "Mar 31 @ 10:00 AM (LIS)",
        dropoff: "Apr 4 @ 9:00 AM (FAO)",
        plan: "Skoda Kamiq (Auto). Ref: BFH972. Includes 1 Child Seat, 1 Booster, Toll Transponder."
    },
    sintraDayTrip: {
        type: "Private Day Trip (MyDaytrip)",
        bookingRef: "3K7RFY5D",
        date: "Mar 30 @ 08:30 AM",
        price: "€200 (Prepaid)",
        vehicle: "MPV (4 pax)",
        pickup: "Martinhal Chiado Lobby",
        dropoff: "Martinhal Chiado",
        status: "Prepaid"
    },
    confirmedDining: [
        { date: "Mar 26", name: "Cervejaria Trindade", time: "7:30 PM" },
        { date: "Mar 27", name: "Pizzeria ZeroZero", time: "7:30 PM" },
        { date: "Mar 28", name: "Estrela da Bica", time: "7:30 PM", note: "CASH ONLY" },
        { date: "Mar 29", name: "Bairro do Avillez - The Páteo", time: "7:30 PM" },
        { date: "Mar 30", name: "Time Out Market", time: "7:30 PM" },
        { date: "Apr 2", name: "Praia Dourada (Anniversary)", time: "7:30 PM" },
        { date: "Apr 3", name: "Austa (Confirm Child Policy)", time: "7:30 PM" }
    ],
    activities: [
        { name: "Sintra Private Day Trip (Mar 30)", details: "MyDaytrip - Ref: 3K7RFY5D" },
        { name: "Tuk-Tuk Tour (Mar 27)", details: "Eco Tuk Tours" },
        { name: "Benagil Cave Tour (Apr 1)", details: "CarvoeiroCaves" },
        { name: "Tile Painting (Mar 28)", details: "Art of Azulejo" },
        { name: "Lagos Grotto Tour (Apr 2)", details: "Lagos Marina" }
    ]
};

// --- Trip Data ---
const itineraryData = [
    { date: "March 26, 2026", dayOfWeek: "Thursday", title: "Arrival & The Grand Hall", location: "Lisbon", events: [
        { time: "11:40 AM", type: 'travel', icon: 'plane-landing', title: "Flight TP204 Arrives at LIS", description: "Take pre-booked transfer with car seats to Martinhal Chiado.", lat: 38.7742, lng: -9.1342, tags: ['Logistics'],
          tips: [
              { icon: 'info', text: 'Check-in is 3:00 PM, but early check-in (11:45 AM) is requested. Let the boys decompress in the hotel\'s supervised playroom!' }
          ] 
        },
        { time: "3:30 PM", type: 'activity', icon: 'footprints', title: "Afternoon: Praça do Comércio", description: "Massive open square right on the river, perfect for toddlers to run safely after a long flight.", lat: 38.7075, lng: -9.1364, tags: ['Kid-Friendly'] },
        { time: "7:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Dinner: Cervejaria Trindade", description: "Massive, historic restaurant in a former monastery. Loud and lively—perfect for active jet-lagged kids.", lat: 38.7118, lng: -9.1418,
          diningDetails: {
              vibe: "Sala dos Azulejos (Tile Room)",
              mehul: "Bife à Trindade (signature steak)",
              nehal: "Vegetable Curry (Veg)",
              boys: "Kids' Menu (steak/fish with potatoes)",
              dessert: "Chocolate Mousse (The best in Lisbon!)"
          },
          tips: [
              { icon: 'star', text: 'Pro-Tip: Request a table in the "Sala dos Azulejos" for the best historic atmosphere.' }
          ]
        }
    ]},
    { date: "March 27, 2026", dayOfWeek: "Friday", title: "Science, Tuk-Tuks & Gardens", location: "Lisbon", events: [
        { time: "9:30 AM", type: 'activity', icon: 'microscope', title: "Morning: Pavilhão do Conhecimento", description: "Science Museum. 100% interactive and incredible for 3 and 5-year-olds.", lat: 38.7622, lng: -9.0950, tags: ['Kid-Favorite'] },
        { time: "12:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: Ofício", description: "Order the famous savory baked cheese tart!", lat: 38.7093, lng: -9.1420 },
        { time: "3:00 PM", type: 'activity', icon: 'truck', title: "Afternoon: Private Tuk-Tuk & Castle", description: "Explore Alfama and São Jorge Castle.", lat: 38.7139, lng: -9.1335,
          tips: [
              { icon: 'wind', text: 'Tuk-Tuk Tip: It can get breezy; bring light layers. Ask for "hidden" Miradouros.' },
              { icon: 'shield-check', text: 'Castle Access: Use the "Under 5" family priority lane to skip the queue.' }
          ] 
        },
        { time: "7:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Dinner: Pizzeria ZeroZero (Príncipe Real)", description: "Famous for its 00-flour crust and beautiful terrace.", lat: 38.7164, lng: -9.1477,
          diningDetails: {
              vibe: "Outdoor Garden (Most beautiful in the city)",
              orders: "Ortolana (Veg) or Formaggiosa"
          },
          tips: [
              { icon: 'tree', text: 'Pro-Tip: Arrive 20 mins early and let the boys run around the Príncipe Real park right outside.' }
          ]
        }
    ]},
    { date: "March 28, 2026", dayOfWeek: "Saturday", title: "Tiles & Royal Carriages", location: "Lisbon", events: [
        { time: "10:00 AM", type: 'activity', icon: 'brush', title: "Morning: Art of Azulejo Workshop", description: "Aarit can paint a traditional tile; Keev can play with clay.", lat: 38.6916, lng: -9.2160 },
        { time: "12:30 PM", type: 'dining', icon: 'coffee', title: "Lunch: Pastéis de Belém", description: "The birthplace of custard tarts.", lat: 38.6975, lng: -9.2032,
          tips: [
              { icon: 'alert-triangle', text: 'Tip: DO NOT wait in the takeout line. Walk straight inside to the back for table service.' }
          ]
        },
        { time: "2:30 PM", type: 'activity', icon: 'crown', title: "Afternoon: National Coach Museum", description: "Visually spectacular fairytale royal carriages.", lat: 38.6968, lng: -9.1992 },
        { time: "7:30 PM", type: 'dining', icon: 'utensils', title: "Dinner: Estrela da Bica", description: "Small, fusion tapas. Very intimate.", lat: 38.7061, lng: -9.1436,
          diningDetails: {
              nehal: "Couve Coração (Grilled Heart Cabbage) (Veg)",
              everyone: "Tuna Tartare Pani Puri and Smoked Beetroot"
          },
          tips: [
              { icon: 'banknote', text: 'CRITICAL: This restaurant is notoriously CASH ONLY. Have €100+ on hand.', isCritical: true },
              { icon: 'camera', text: 'The famous Bica Funicular is right outside for the iconic "Lisbon Tram" photo!' }
          ]
        }
    ]},
    { date: "March 29, 2026", dayOfWeek: "Sunday", title: "Sunday Vibe & Under the Sea", location: "Lisbon", events: [
        { time: "9:30 AM", type: 'activity', icon: 'fish', title: "Morning: Oceanário de Lisboa", description: "Completely stroller friendly. The massive central tank is mesmerizing.", lat: 38.7634, lng: -9.0937, tags: ['Kid-Favorite'] },
        { time: "12:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: D'Bacalhau", description: "Casual waterfront dining in Parque das Nações.", lat: 38.7663, lng: -9.0945 },
        { time: "3:00 PM", type: 'activity', icon: 'shopping-bag', title: "Afternoon: LX Factory Sunday Market", description: "No-car zone, vibrant street art, and great shopping.", lat: 38.7032, lng: -9.1787 },
        { time: "7:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Dinner: Bairro do Avillez - The Páteo", description: "High-end but relaxed 'inner courtyard' feel.", lat: 38.7093, lng: -9.1420,
          diningDetails: {
              nehal: "Mushroom Risotto or Caponata with Lentils (Veg)",
              boys: "Artisanal Ice Cream Cart"
          },
          tips: [
              { icon: 'shopping-basket', text: 'Pro-Tip: Walk through the "Taberna" section on your way in to see the gourmet pantry.' }
          ]
        }
    ]},
    { date: "March 30, 2026", dayOfWeek: "Monday", title: "Fairytale Sintra", location: "Sintra", events: [
        { time: "08:30 AM", type: 'travel', icon: 'car', title: "Private Driver Pick-up", description: "Daytrip pick-up from Martinhal Chiado.", lat: 38.7086, lng: -9.1425 },
        { time: "09:30 AM", type: 'activity', icon: 'castle', title: "Sintra: Pena & Regaleira", description: "Explore the palaces and mystical gardens.", lat: 38.7507, lng: -9.2590,
          tips: [
              { icon: 'footprints', text: 'Attire: Wear grippy shoes (cobblestones are slippery!). Use toddler carrier.' },
              { icon: 'palace', text: 'Pena Palace: Focus on terraces if interior lines are too long.' },
              { icon: 'map', text: 'Quinta da Regaleira: Don\'t miss the Initiation Well (inverted tower).' }
          ]
        },
        { time: "1:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: Tascantiga", description: "Historic center spot, very kid-welcoming.", lat: 38.7963, lng: -9.3900 },
        { time: "3:00 PM", type: 'activity', icon: 'leaf', title: "Afternoon: Monserrate Park", description: "Massive botanical lawns perfect for letting kids run barefoot.", lat: 38.7930, lng: -9.4206 },
        { time: "7:30 PM", type: 'dining', icon: 'utensils', title: "Dinner: Time Out Market", description: "Food hall with endless options.", lat: 38.7058, lng: -9.1456,
          tips: [
              { icon: 'users', text: 'Strategy: No reservations. One person finds a table, the other explores stalls.' },
              { icon: 'bell', text: 'Dessert: Manteigaria (2 mins away) for the best Pastéis de Nata.' }
          ]
        }
    ]},
    { date: "March 31, 2026", dayOfWeek: "Tuesday", title: "The Journey South", location: "Lisbon -> Algarve", events: [
        { time: "10:00 AM", type: 'travel', icon: 'car', title: "Pick up Skoda Kamiq Rental Car", description: "Rental from Zest/Rent Car 4 Less.", lat: 38.7742, lng: -9.1342,
          tips: [
              { icon: 'alert-triangle', text: 'CRITICAL: Verify booster and 5-point harness seats are secure before leaving.', isCritical: true }
          ]
        },
        { time: "11:00 AM", type: 'travel', icon: 'map', title: "Drive to Algarve", description: "2.5 hours down the A2 highway. Time with boys' nap!" },
        { time: "3:00 PM", type: 'rest', icon: 'key-round', title: "Check-in: Vila Vita Parc", description: "Settle into your Family Suite Oasis.", lat: 37.1017, lng: -8.3813 },
        { time: "6:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Dinner: Vila Vita Biergarten", description: "Casual, outdoor Bavarian food right on site.", lat: 37.1126, lng: -8.3842 }
    ]},
    { date: "April 1, 2026", dayOfWeek: "Wednesday", title: "Sea Caves & Artisan Hands", location: "Algarve", events: [
        { time: "9:30 AM", type: 'activity', icon: 'ship', title: "Morning: Benagil Cave Boat Tour", description: "See the spectacular sea caves.", lat: 37.0872, lng: -8.4258 },
        { time: "12:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: Carvoeiro Beachfront", description: "Casual cafes overlooking the water.", lat: 37.0963, lng: -8.4715 },
        { time: "2:30 PM", type: 'activity', icon: 'brush', title: "Afternoon: Porches Pottery Workshop", description: "Watch artisans and let the boys paint ceramics.", lat: 37.1265, lng: -8.3995 },
        { time: "7:00 PM", type: 'dining', icon: 'utensils', title: "Dinner: Adega", description: "Traditional Portuguese cuisine on-site at the resort.", lat: 37.1017, lng: -8.3813 }
    ]},
    { date: "April 2, 2026", dayOfWeek: "Thursday", title: "Lagos & 10th Anniversary!", location: "Algarve", events: [
        { time: "10:00 AM", type: 'activity', icon: 'anchor', title: "Morning: Lagos Grotto Boat Tour", description: "Short ride from the marina into the rock arches.", lat: 37.1085, lng: -8.6734 },
        { time: "1:00 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: A Forja in Lagos", description: "Authentic local spot.", lat: 37.1025, lng: -8.6740 },
        { time: "3:00 PM", type: 'activity', icon: 'bird', title: "Afternoon: Lagos Zoo", description: "Highly walkable zoo with a petting farm.", lat: 37.1511, lng: -8.7663 },
        { time: "7:30 PM", type: 'dining', icon: 'glass-water', title: "Anniversary Dinner: Praia Dourada! 🥂", description: "Chic beach club at Armação de Pêra.", lat: 37.1017, lng: -8.3813,
          diningDetails: {
              vibe: "Front Row Terrace (Sunset)",
              order: "Mozambican Prawn Curry (A specialty!)"
          },
          tips: [
              { icon: 'gift', text: 'Pro-Tip: Tell staff it\'s your anniversary for a small celebratory gesture.' }
          ]
        }
    ]},
    { date: "April 3, 2026", dayOfWeek: "Friday", title: "Flamingos & Giants", location: "Algarve", events: [
        { time: "10:00 AM", type: 'activity', icon: 'bird', title: "Morning: Ludo Trail in Ria Formosa", description: "Stroller-friendly boardwalks to spot flamingos.", lat: 37.0211, lng: -7.9866 },
        { time: "3:30 PM", type: 'activity', icon: 'mountain', title: "Afternoon: Sand City (Fiesa)", description: "World\'s largest sand sculpture park.", lat: 37.1260, lng: -8.3340 },
        { time: "7:30 PM", type: 'dining', icon: 'utensils', title: "Dinner: Austa (Almancil)", description: "Grilled Fermented Cabbage (Veg) is a masterpiece.", lat: 37.0850, lng: -8.0280,
          tips: [
              { icon: 'alert-octagon', text: 'CHILD POLICY: Kids welcome until 5 PM. Confirm dinner exception with concierge (+351 911 546 951).', isCritical: true }
          ]
        }
    ]},
    { date: "April 4, 2026", dayOfWeek: "Saturday", title: "Smooth Departure", location: "Algarve to NYC", events: [
        { time: "9:00 AM", type: 'travel', icon: 'car', title: "Return Rental Car (FAO)", description: "Get a receipt for the car seats!", lat: 37.0144, lng: -7.9659 },
        { time: "11:15 AM", type: 'travel', icon: 'plane-takeoff', title: "Flight TP1902 to Lisbon", description: "Short hopper flight up to LIS.", lat: 38.7742, lng: -9.1342 },
        { time: "1:00 PM", type: 'activity', icon: 'coffee', title: "Lisbon Layover: TAP Lounge", description: "Enjoy free food and a stress-free space.",
          tips: [
              { icon: 'alert-octagon', text: 'CRITICAL: Do not leave the airport. Managing security twice with toddlers is not worth it!', isCritical: true }
          ]
        },
        { time: "5:55 PM", type: 'travel', icon: 'plane', title: "Flight TP203 to Newark", description: "Boarding home. Safe travels!" }
    ]}
];

let checklists = {
    "Critical Bookings (Do These ASAP)": [
        { text: "Multi-city flights (EWR→LIS, FAO→EWR)", checked: true },
        { text: "Martinhal Chiado (5 nights)", checked: true },
        { text: "Vila Vita Parc (4 nights)", checked: true },
        { text: "Rental car pick-up LIS, drop-off FAO (Add Booster + Toddler Seat!)", checked: true },
        { text: "Private airport transfer in Lisbon (Request car seats)", checked: false },
        { text: "Anniversary Dinner at Praia Dourada (April 2)", checked: false }
    ],
    "Activity Reservations": [
        { text: "São Jorge Castle: Skip-the-line tickets", checked: false },
        { text: "Private Tuk-Tuk Tour (Lisbon)", checked: false },
        { text: "Private Day Trip for Sintra (Prepaid Ref: 3K7RFY5D)", checked: true },
        { text: "Benagil Cave Tour (Request Catamaran & toddler life jackets)", checked: false },
        { text: "Oceanário de Lisboa tickets", checked: false },
        { text: "Lisbon Airport Lounge passes (for layover)", checked: false }
    ],
    "Kid Essentials (Aarit 5, Keev 3)": [
        { text: "Lightweight Travel Stroller (for Belém/Algarve)", checked: false },
        { text: "Toddler Carrier (Mandatory for Chiado/Sintra)", checked: false },
        { text: "Healthy/Organic snacks for travel days", checked: false },
        { text: "Tablet/Headphones pre-loaded with shows", checked: false },
        { text: "Small travel activities/coloring books", checked: false }
    ],
    "General Packing": [
        { text: "Passports (valid 6+ months from April 2026)", checked: false },
        { text: "EU Plug adapters (Type C/F)", checked: false },
        { text: "Lightweight rain jackets (March/April weather)", checked: false },
        { text: "Comfortable, sturdy walking shoes (calçada is slippery!)", checked: false },
        { text: "Swimsuits & Sunscreen (for Algarve pools/beach)", checked: false }
    ]
};

const travelGuide = {
    knowBeforeYouGo: { title: 'Family Travel in Portugal', points: [
        { icon: 'baby', title: 'Kid-Friendly Culture', text: 'Portugal is exceptionally welcoming to children. It is completely normal for kids to be in restaurants later in the evening.' },
        { icon: 'shield-check', title: 'The "Under 5" Law', text: 'Families with children under 5 legally get priority access at museums, castles, and airport security.' },
        { icon: 'footprints', title: 'Navigating Cobblestones', text: 'Lisbon is hilly and paved with calçada. A baby carrier is highly recommended for exploring Chiado and Sintra.' },
        { icon: 'salad', title: 'Food & Dining', text: '"Sopa de legumes" (vegetable soup) is on almost every menu and is a healthy, kid-approved staple.' },
        { icon: 'car', title: 'Car Seats', text: 'By law, children under 135cm must use an appropriate seat. Ensure all transfers are booked with seats.' }
    ]}
};

// --- Helpers ---
const generateTripId = () => 'trip-' + Math.random().toString(36).substr(2, 10);
const getTripId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    let tid = urlParams.get('trip');
    if (tid) { localStorage.setItem('tripId', tid); return tid; }
    tid = localStorage.getItem('tripId');
    if (tid) return tid;
    tid = generateTripId();
    localStorage.setItem('tripId', tid);
    return tid;
};
const tripId = getTripId();

const showToast = (msg = 'Progress saved!') => {
    const toast = document.getElementById('toast-checklist');
    if (!toast) return;
    const msgEl = document.getElementById('toast-message');
    if (msgEl) msgEl.textContent = msg;
    toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
    setTimeout(() => toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4'), 2500);
};

const createIcons = () => {
    if (window.lucide) window.lucide.createIcons();
};

// --- Rendering Functions ---
const renderSidebarNav = () => {
    const container = document.getElementById('timeline-nav-links');
    if (!container) return;

    container.innerHTML = itineraryData.map((day, index) => {
        const isActive = (index === currentDay && currentSection === 'itinerary');
        return `
        <button class="nav-link w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center group ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}" data-section="itinerary" data-day="${index}">
            <div class="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center mr-3 transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-700'}">
                ${index + 1}
            </div>
            <div class="flex flex-col truncate">
                <span class="truncate ${isActive ? 'text-white' : 'text-slate-700'}">${day.dayOfWeek}</span>
                <span class="text-[10px] truncate ${isActive ? 'text-slate-300 font-normal' : 'text-slate-400 font-medium'}">${day.location}</span>
            </div>
        </button>`;
    }).join('');

    document.querySelectorAll('nav .nav-link').forEach(btn => {
        const icon = btn.querySelector('i, svg');
        if (btn.dataset.section === currentSection) {
            btn.classList.add('bg-teal-50', 'text-teal-700');
            btn.classList.remove('text-slate-600');
            if (icon) icon.classList.remove('opacity-70');
        } else {
            btn.classList.remove('bg-teal-50', 'text-teal-700');
            btn.classList.add('text-slate-600');
            if (icon) icon.classList.add('opacity-70');
        }
    });
    createIcons();
};

const renderDayContent = (dayIndex) => {
    const dayData = itineraryData[dayIndex];
    const content = document.getElementById('itinerary-section');
    if (!content) return;

    const nextBtnHtml = (dayIndex < itineraryData.length - 1) ? `
        <div class="mt-12 text-center pb-8">
            <button id="next-day-btn" class="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center mx-auto space-x-2">
                <span>Continue to ${itineraryData[dayIndex + 1].dayOfWeek}</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
        </div>` : `
        <div class="mt-12 text-center pb-8">
            <div class="inline-flex items-center space-x-2 text-teal-600 font-bold bg-teal-50 px-6 py-3 rounded-full">
                <i data-lucide="party-popper" class="w-5 h-5"></i>
                <span>End of Trip Plan</span>
            </div>
        </div>`;

    content.innerHTML = `
        <div class="mb-8">
            <div class="inline-flex items-center space-x-2 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-teal-100">
                <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                <span>${dayData.location}</span>
            </div>
            <h2 class="font-outfit text-4xl font-extrabold text-slate-800 tracking-tight">${dayData.title}</h2>
            <p class="text-slate-500 font-medium mt-2 text-lg">${dayData.dayOfWeek}, ${dayData.date}</p>
        </div>
        
        <div class="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            ${dayData.events.map((event, idx) => {
                const key = `${dayIndex}-${idx}`;
                const note = eventNotes[key] || '';
                
                let tagsHtml = '';
                if (event.tags) {
                    tagsHtml = `<div class="flex flex-wrap gap-2 mt-3">` + 
                        event.tags.map(tag => `<span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200">${tag}</span>`).join('') + 
                    `</div>`;
                }

                let tipsHtml = '';
                if (event.tips) {
                    tipsHtml = `<div class="mt-4 space-y-2">` + 
                        event.tips.map(tip => `
                        <div class="flex items-start ${tip.isCritical ? 'bg-red-50 border-red-200' : 'bg-yellow-50/80 border-yellow-200/60'} p-3 rounded-xl border">
                            <div class="${tip.isCritical ? 'bg-red-100' : 'bg-yellow-100'} p-1.5 rounded-lg mr-3 flex-shrink-0 mt-0.5">
                                <i data-lucide="${tip.icon}" class="w-4 h-4 ${tip.isCritical ? 'text-red-700' : 'text-yellow-700'}"></i>
                            </div>
                            <span class="text-sm ${tip.isCritical ? 'text-red-900 font-bold' : 'text-yellow-900 font-medium'} leading-relaxed">${tip.text}</span>
                        </div>
                        `).join('') + 
                    `</div>`;
                }

                let diningDetailsHtml = '';
                if (event.diningDetails) {
                    diningDetailsHtml = `
                    <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">Order Details</h4>
                        <ul class="space-y-2 text-sm">
                            ${event.diningDetails.vibe ? `<li><strong class="text-slate-800">Vibe:</strong> <span class="text-slate-600">${event.diningDetails.vibe}</span></li>` : ''}
                            ${event.diningDetails.mehul ? `<li><strong class="text-slate-800">Mehul:</strong> <span class="text-slate-600">${event.diningDetails.mehul}</span></li>` : ''}
                            ${event.diningDetails.nehal ? `<li><strong class="text-slate-800">Nehal:</strong> <span class="text-slate-600">${event.diningDetails.nehal}</span> <span class="veg-badge ml-1">Veg</span></li>` : ''}
                            ${event.diningDetails.boys ? `<li><strong class="text-slate-800">The Boys:</strong> <span class="text-slate-600">${event.diningDetails.boys}</span></li>` : ''}
                            ${event.diningDetails.orders ? `<li><strong class="text-slate-800">Order:</strong> <span class="text-slate-600">${event.diningDetails.orders}</span></li>` : ''}
                            ${event.diningDetails.order ? `<li><strong class="text-slate-800">Order:</strong> <span class="text-slate-600">${event.diningDetails.order}</span></li>` : ''}
                            ${event.diningDetails.dessert ? `<li><strong class="text-slate-800">Dessert:</strong> <span class="text-slate-600">${event.diningDetails.dessert}</span></li>` : ''}
                        </ul>
                    </div>`;
                }

                return `
                <div class="relative flex items-start group w-full">
                    <div class="absolute left-6 -translate-x-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-white border-4 border-slate-50 shadow-sm z-10 transition-transform group-hover:scale-110">
                        <div class="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                            <i data-lucide="${event.icon}" class="w-4 h-4"></i>
                        </div>
                    </div>
                    
                    <div class="ml-16 w-full pr-2 md:pr-0">
                        <div class="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                            
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-xs font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">${event.time}</span>
                            </div>
                            
                            <h3 class="text-xl font-outfit font-bold text-slate-800 mb-2">${event.title}</h3>
                            
                            ${event.description ? `<p class="text-slate-600 text-sm leading-relaxed mb-3">${event.description}</p>` : ''}
                            
                            ${diningDetailsHtml}
                            
                            ${tipsHtml}
                            ${tagsHtml}
                            
                            <div class="mt-5 pt-4 border-t border-slate-100 text-left">
                                <button class="text-xs font-bold text-slate-400 hover:text-teal-600 flex items-center transition-colors toggle-notes" data-key="${key}">
                                    <i data-lucide="pen-line" class="w-3.5 h-3.5 mr-1.5"></i>
                                    ${note ? 'Edit Note' : 'Add Note'}
                                </button>
                                <div id="notes-${key}" class="${note ? '' : 'hidden'} mt-3">
                                    <textarea class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 outline-none resize-none transition-shadow" rows="2" placeholder="e.g., Make sure to bring stroller...">${note}</textarea>
                                    <div class="flex justify-end mt-2">
                                        <button class="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors save-note" data-key="${key}">Save</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>
        ${nextBtnHtml}`;
    
    createIcons();
    
    // Attach specific event listeners
    content.querySelectorAll('.toggle-notes').forEach(btn => {
        btn.onclick = () => {
            const el = document.getElementById(`notes-${btn.dataset.key}`);
            el.classList.toggle('hidden');
            if (!el.classList.contains('hidden')) el.querySelector('textarea').focus();
        };
    });

    content.querySelectorAll('.save-note').forEach(btn => {
        btn.onclick = () => {
            const key = btn.dataset.key;
            const val = document.querySelector(`#notes-${key} textarea`).value.trim();
            eventNotes[key] = val;
            saveTripState();
            
            const container = document.getElementById(`notes-${key}`);
            const toggleBtn = document.querySelector(`.toggle-notes[data-key="${key}"]`);
            
            if (!val) {
                container.classList.add('hidden');
                toggleBtn.innerHTML = `<i data-lucide="pen-line" class="w-3.5 h-3.5 mr-1.5"></i> Add Note`;
            } else {
                toggleBtn.innerHTML = `<i data-lucide="pen-line" class="w-3.5 h-3.5 mr-1.5"></i> Edit Note`;
            }
            createIcons();
        };
    });

    const nextBtn = document.getElementById('next-day-btn');
    if (nextBtn) {
        nextBtn.onclick = () => {
            currentDay++;
            saveTripState(); 
            switchSection('itinerary', currentDay);
            const mainContent = document.querySelector('.custom-scrollbar');
            if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }
};

const renderMap = () => {
    const dayData = itineraryData[currentDay];
    const subtitle = document.getElementById('map-subtitle');
    if (subtitle) subtitle.textContent = `Locations for Day ${currentDay + 1}: ${dayData.title}`;
    if (!window.L) return;
    if (!mapInstance) {
        mapInstance = L.map('leaflet-map').setView([38.7223, -9.1393], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(mapInstance);
    }
    mapMarkers.forEach(m => mapInstance.removeLayer(m));
    mapMarkers = [];
    const bounds = L.latLngBounds();
    let hasPoints = false;
    dayData.events.forEach(event => {
        if (event.lat && event.lng) {
            const customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #0d9488; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            const marker = L.marker([event.lat, event.lng], { icon: customIcon }).addTo(mapInstance);
            marker.bindPopup(`<div class="font-sans"><span class="text-xs font-bold text-teal-600 block mb-1">${event.time}</span><strong class="text-sm text-slate-800 block">${event.title}</strong></div>`);
            mapMarkers.push(marker);
            bounds.extend([event.lat, event.lng]);
            hasPoints = true;
        }
    });
    setTimeout(() => {
        mapInstance.invalidateSize();
        if (hasPoints) {
            mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } else {
            if (currentDay > 4) mapInstance.setView([37.1017, -8.3813], 10);
            else mapInstance.setView([38.7223, -9.1393], 12);
        }
    }, 250);
};

const renderBookings = () => {
    const content = document.getElementById('bookings-section');
    if (!content) return;
    
    const flightsHtml = `
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
            <h2 class="text-2xl font-outfit font-bold text-slate-800 mb-6 flex items-center"><i data-lucide="plane" class="w-6 h-6 mr-3 text-teal-600"></i>Flight Information</h2>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div><span class="text-sm text-slate-500 block">Airline</span><strong class="text-slate-800">${reservationData.flights.airline}</strong></div>
                <div class="md:text-right"><span class="text-sm text-slate-500 block">Booking Reference (PNR)</span><strong class="text-xl font-mono text-teal-700">${reservationData.flights.pnr}</strong></div>
            </div>
            
            <h4 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Passengers & Tickets</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                ${reservationData.flights.passengers.map(p => `
                    <div class="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                        <span class="block font-bold text-slate-800 text-sm">${p.name}</span>
                        <span class="block text-xs text-slate-500 font-mono mt-1">Ticket: ${p.ticket}</span>
                        ${p.seat ? `<span class="block text-xs text-teal-600 font-bold mt-1">Seat: ${p.seat}</span>` : ''}
                    </div>
                `).join('')}
            </div>

            <h4 class="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Flight Schedule</h4>
            <div class="space-y-3">
                ${reservationData.flights.schedule.map(s => `
                    <div class="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <div>
                            <span class="inline-block px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded uppercase tracking-wider mb-1.5">${s.label || 'Departure'}</span>
                            <span class="block text-xs font-bold text-slate-500">${s.date}</span>
                            <strong class="block text-lg text-slate-800 mt-0.5">${s.route}</strong>
                        </div>
                        <div class="mt-3 md:mt-0 md:text-right">
                            <span class="block text-sm font-bold text-slate-600">Flight: ${s.flight}</span>
                            <span class="block text-teal-600 font-bold mt-1">${s.time}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const hotelsHtml = `
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
            <h2 class="text-2xl font-outfit font-bold text-slate-800 mb-6 flex items-center"><i data-lucide="building" class="w-6 h-6 mr-3 text-teal-600"></i>Hotel Reservations</h2>
            <div class="space-y-6">
                ${reservationData.hotels.map((h, i) => `
                    <div class="border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                        <div class="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
                        <div class="flex flex-col md:flex-row justify-between md:items-start mb-4 gap-3">
                            <div>
                                <span class="text-xs font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-1 rounded">${i + 1}. ${h.location}</span>
                                <h3 class="text-xl font-bold text-slate-800 mt-2">${h.name}</h3>
                                <p class="text-sm font-medium text-slate-500 mt-1">${h.dates}</p>
                            </div>
                            <div class="md:text-right bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 self-start">
                                <span class="block text-xs text-slate-500 mb-0.5">Confirmation #</span>
                                <strong class="text-sm font-mono text-slate-800">${h.bookingId}</strong>
                            </div>
                        </div>
                        <div class="grid md:grid-cols-2 gap-4 text-sm bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <div>
                                <span class="block text-slate-500 mb-1 text-xs uppercase tracking-wider font-bold">Room Type</span>
                                <strong class="text-slate-800">${h.roomType}</strong>
                            </div>
                            <div>
                                <span class="block text-slate-500 mb-1 text-xs uppercase tracking-wider font-bold">Schedule</span>
                                <strong class="text-slate-800">In: ${h.checkIn} | Out: ${h.checkOut}</strong>
                            </div>
                        </div>
                        ${h.benefits ? `<div class="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200/60 text-sm"><strong class="text-yellow-800">Added Benefits:</strong> <span class="text-yellow-900/80">${h.benefits}</span></div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const transportHtml = `
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
            <h2 class="text-2xl font-outfit font-bold text-slate-800 mb-6 flex items-center"><i data-lucide="car" class="w-6 h-6 mr-3 text-teal-600"></i>Ground Transportation</h2>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Main Rental -->
                <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <span class="inline-block px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded uppercase tracking-wider mb-2">Main Rental (LIS → FAO)</span>
                    <h3 class="text-lg font-bold text-slate-800 mb-4">${reservationData.transport.type}</h3>
                    <div class="grid grid-cols-1 gap-4 mb-5">
                        <div class="bg-white p-3 rounded-xl border border-slate-100">
                            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Details</span>
                            <strong class="text-sm text-slate-800 block">${reservationData.transport.pickup} TO ${reservationData.transport.dropoff}</strong>
                        </div>
                    </div>
                    <div class="p-3.5 bg-white rounded-xl border border-slate-200 text-sm flex items-start">
                        <i data-lucide="info" class="w-5 h-5 text-teal-600 mr-2 flex-shrink-0 mt-0.5"></i>
                        <div>
                            <span class="font-bold text-slate-800 block mb-0.5">Plan:</span> 
                            <span class="text-slate-600 leading-relaxed">${reservationData.transport.plan}</span>
                        </div>
                    </div>
                </div>

                <!-- Sintra Day Trip -->
                <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <span class="inline-block px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded uppercase tracking-wider mb-2">Sintra Private Car (Day Trip)</span>
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg font-bold text-slate-800">${reservationData.sintraDayTrip.type}</h3>
                        <div class="bg-teal-100 text-teal-700 px-2 py-1 rounded text-xs font-bold font-mono">${reservationData.sintraDayTrip.bookingRef}</div>
                    </div>
                    <div class="space-y-3 mb-5">
                        <div class="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                            <div><span class="text-[10px] font-bold text-slate-400 uppercase block">Vehicle</span><strong class="text-sm text-slate-800">${reservationData.sintraDayTrip.vehicle}</strong></div>
                            <div class="text-right"><span class="text-[10px] font-bold text-slate-400 uppercase block">Price</span><strong class="text-sm text-teal-700">${reservationData.sintraDayTrip.price}</strong></div>
                        </div>
                        <div class="bg-white p-3 rounded-xl border border-slate-100">
                            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pickup</span>
                            <strong class="text-sm text-slate-800 block">${reservationData.sintraDayTrip.date}</strong>
                            <span class="text-xs text-slate-500 mt-1 block">${reservationData.sintraDayTrip.pickup}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const diningDirectoryHtml = `
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
            <h2 class="text-2xl font-outfit font-bold text-slate-800 mb-6 flex items-center"><i data-lucide="utensils" class="w-6 h-6 mr-3 text-teal-600"></i>Confirmed Dining (7:30 PM)</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${reservationData.confirmedDining.map(d => `
                    <div class="p-4 border border-slate-200 bg-slate-50 rounded-xl flex justify-between items-center">
                        <div>
                            <span class="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">${d.date}</span>
                            <strong class="text-slate-800 block">${d.name}</strong>
                            ${d.note ? `<span class="text-[10px] text-red-600 font-bold uppercase mt-1 block">${d.note}</span>` : ''}
                        </div>
                        <span class="text-xs font-bold text-slate-400">${d.time}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const categories = [
        { key: 'flights', label: 'Flights (EWR to LIS/FAO)', estimate: 2400 },
        { key: 'lodgingLisbon', label: 'Martinhal Chiado (5 Nights)', estimate: 2000 },
        { key: 'lodgingAlgarve', label: 'Vila Vita Parc (4 Nights)', estimate: 2200 },
        { key: 'rentalCar', label: 'Rental Car + Car Seats', estimate: 450 },
        { key: 'dining', label: 'Dining & Groceries', estimate: 1800 },
        { key: 'activities', label: 'Tours & Excursions', estimate: 800 }
    ];
    let actTotal = 0;
    const rowsHtml = categories.map(c => {
        const val = userExpenses[c.key] || '';
        actTotal += Number(val || 0);
        return `
        <div class="flex items-center justify-between py-4 border-b border-slate-100 last:border-0 group">
            <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3 md:mr-4 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    <i data-lucide="circle-dollar-sign" class="w-4 h-4"></i>
                </div>
                <div>
                    <span class="text-sm font-bold text-slate-800 block">${c.label}</span>
                    <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Est: $${c.estimate}</span>
                </div>
            </div>
            <div class="relative flex-shrink-0 ml-2">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input type="number" data-key="${c.key}" value="${val}" class="w-24 md:w-28 pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all expense-input" placeholder="0">
            </div>
        </div>`;
    }).join('');

    const budgetHtml = `
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-2xl font-outfit font-bold text-slate-800">Trip Budget</h2>
                    <p class="text-sm text-slate-500 mt-1">Track actual costs against estimates</p>
                </div>
                <div class="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center hidden md:flex">
                    <i data-lucide="calculator" class="w-6 h-6"></i>
                </div>
            </div>
            
            <div class="space-y-1 mb-8">
                ${rowsHtml}
            </div>
            
            <div class="p-6 bg-slate-900 rounded-2xl flex justify-between items-center text-white">
                <div>
                    <span class="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">Total Recorded</span>
                    <span class="text-3xl font-outfit font-bold tracking-tight">$${actTotal.toFixed(2)}</span>
                </div>
                <div class="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
                    <i data-lucide="wallet" class="w-5 h-5 text-teal-400"></i>
                </div>
            </div>
        </div>
    `;

    content.innerHTML = `
        <div class="max-w-4xl mx-auto">
            ${flightsHtml}
            ${hotelsHtml}
            ${transportHtml}
            ${diningDirectoryHtml}
            ${budgetHtml}
        </div>
    `;

    content.querySelectorAll('.expense-input').forEach(input => {
        input.onchange = () => {
            userExpenses[input.dataset.key] = input.value;
            saveTripState();
            renderBookings();
        };
    });
    createIcons();
};

const renderChecklists = () => {
    const content = document.getElementById('checklists-section');
    if (!content) return;
    let totalItems = 0;
    let checkedItems = 0;
    Object.values(checklists).forEach(list => {
        list.forEach(item => {
            totalItems++;
            if (item.checked) checkedItems++;
        });
    });
    const progress = totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);

    content.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 flex items-center space-x-6">
                <div class="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path class="text-slate-100" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="text-teal-500 transition-all duration-1000 ease-out" stroke-dasharray="${progress}, 100" stroke-width="3" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span class="absolute text-sm font-bold text-slate-800">${progress}%</span>
                </div>
                <div>
                    <h3 class="text-xl font-outfit font-bold text-slate-800">Preparation Progress</h3>
                    <p class="text-sm text-slate-500 mt-1">${checkedItems} of ${totalItems} tasks completed</p>
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
                ${Object.keys(checklists).map(title => `
                    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 class="font-outfit text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center">
                            <i data-lucide="list-checks" class="w-4 h-4 mr-2 text-teal-600"></i>
                            ${title}
                        </h3>
                        <div class="space-y-3">
                            ${checklists[title].map((item, idx) => `
                                <label class="flex items-start space-x-3 cursor-pointer group p-2 hover:bg-slate-50 rounded-lg transition-colors -mx-2">
                                    <div class="relative flex items-center justify-center mt-0.5">
                                        <input type="checkbox" data-list="${title}" data-idx="${idx}" ${item.checked ? 'checked' : ''} class="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded focus:ring-2 focus:ring-teal-500/20 checked:bg-teal-500 checked:border-teal-500 transition-all checklist-check cursor-pointer">
                                        <i data-lucide="check" class="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                                    </div>
                                    <span class="text-sm font-medium transition-all duration-200 ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-slate-900'}">${item.text}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    
    createIcons();

    content.querySelectorAll('.checklist-check').forEach(check => {
        check.onchange = () => {
            checklists[check.dataset.list][check.dataset.idx].checked = check.checked;
            saveTripState();
            renderChecklists();
        };
    });
};

const renderGuide = () => {
    const content = document.getElementById('guide-section');
    if (!content) return;
    content.innerHTML = `
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto">
            <div class="text-center mb-10">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 text-teal-600 mb-4">
                    <i data-lucide="book-heart" class="w-8 h-8"></i>
                </div>
                <h2 class="text-3xl font-outfit font-bold text-slate-800">Family Travel Guide</h2>
                <p class="text-slate-500 mt-2 font-medium">Tactical tips for navigating Portugal with a 3 & 5 year old</p>
            </div>
            
            <div class="space-y-6">
                ${travelGuide.knowBeforeYouGo.points.map(p => `
                    <div class="flex items-start space-x-5 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div class="bg-teal-50 p-3 rounded-xl text-teal-600 shadow-sm border border-teal-100 flex-shrink-0">
                            <i data-lucide="${p.icon}" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h4 class="font-outfit text-lg font-bold text-slate-800">${p.title}</h4>
                            <p class="text-sm text-slate-600 leading-relaxed mt-2">${p.text}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    createIcons();
};

const renderActiveSection = () => {
    const titleEl = document.getElementById('mobile-header-title');
    if (titleEl) titleEl.textContent = sectionTitles[currentSection] || 'Trip';
    document.querySelectorAll('.main-content-section').forEach(s => s.classList.add('hidden'));
    const activeSection = document.getElementById(`${currentSection}-section`);
    if (activeSection) activeSection.classList.remove('hidden');

    if (currentSection === 'itinerary') renderDayContent(currentDay);
    else if (currentSection === 'map') renderMap();
    else if (currentSection === 'bookings') renderBookings();
    else if (currentSection === 'checklists') renderChecklists();
    else if (currentSection === 'guide') renderGuide();
};

const switchSection = (sectionId, dayIndex = 0, shouldSave = true) => {
    currentSection = sectionId;
    currentDay = dayIndex;
    renderSidebarNav();
    renderActiveSection();
    if (shouldSave) saveTripState();
};

// --- Persistence & Firebase Sync ---
const saveTripState = async () => {
    const state = {
        currentDay,
        eventNotes,
        userExpenses,
        checklists: JSON.parse(JSON.stringify(checklists)),
        lastUpdated: new Date().toISOString()
    };
    
    // 1. Immediate save to LocalStorage (Always works, even without config)
    localStorage.setItem(`trip_state_${tripId}`, JSON.stringify(state));

    // 2. Sync to Cloud Firestore if configured
    if (!db) return;
    const docRef = doc(db, "artifacts", appId, "public", "data", "trips", tripId);
    try {
        await setDoc(docRef, state, { merge: true });
        showToast();
    } catch (e) { console.error("Cloud Save Error:", e); }
};

const loadLocalState = () => {
    const saved = localStorage.getItem(`trip_state_${tripId}`);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.currentDay !== undefined) currentDay = data.currentDay;
            if (data.eventNotes) eventNotes = data.eventNotes;
            if (data.userExpenses) userExpenses = data.userExpenses;
            if (data.checklists) {
                Object.keys(checklists).forEach(k => {
                    if (data.checklists[k]) checklists[k] = data.checklists[k];
                });
            }
            return true;
        } catch (e) { console.error("Local load error", e); }
    }
    return false;
};

const startTripStateListener = () => {
    if (!db) return;
    const docRef = doc(db, "artifacts", appId, "public", "data", "trips", tripId);
    
    tripStateUnsubscribe = onSnapshot(docRef, (docSnap) => {
        if (!docSnap.exists()) return;
        
        let data = docSnap.data();
        if (data.currentDay !== undefined && !hasInitialDataLoaded) currentDay = data.currentDay;
        if (data.eventNotes) eventNotes = data.eventNotes;
        if (data.userExpenses) userExpenses = data.userExpenses;
        
        if (data.checklists) {
            Object.keys(checklists).forEach(k => {
                if (data.checklists[k]) checklists[k] = data.checklists[k];
            });
        }

        if (!hasInitialDataLoaded) {
            renderSidebarNav();
            renderActiveSection();
            hasInitialDataLoaded = true;
        } else {
            // Re-render specific screens if they are currently visible
            if (currentSection === 'checklists') renderChecklists();
            if (currentSection === 'bookings') renderBookings();
        }
    }, (error) => console.error("Firestore Listen Error:", error));
};

const setupFirebase = async () => {
    startTripStateListener();
};

// --- Main Init ---
const initApp = () => {
    // 1. Load from LocalStorage first for instant results
    loadLocalState();

    // 2. Set up Event Listeners
    const openSidebarBtn = document.getElementById('open-sidebar');
    if (openSidebarBtn) {
        openSidebarBtn.onclick = () => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar) sidebar.classList.remove('-translate-x-full');
            if (overlay) overlay.classList.remove('opacity-0', 'pointer-events-none');
        };
    }

    const closeSidebar = () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.add('-translate-x-full');
        if (overlay) overlay.classList.add('opacity-0', 'pointer-events-none');
    };

    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.onclick = closeSidebar;
    
    const closeSidebarBtn = document.getElementById('close-sidebar');
    if (closeSidebarBtn) closeSidebarBtn.onclick = closeSidebar;

    const nav = document.querySelector('nav');
    if (nav) {
        nav.onclick = (e) => {
            const btn = e.target.closest('.nav-link');
            if (!btn) return;
            
            const section = btn.dataset.section;
            const day = btn.dataset.day ? parseInt(btn.dataset.day) : currentDay;
            
            switchSection(section, day);
            if (window.innerWidth < 768) closeSidebar();
            
            const main = document.querySelector('main .overflow-y-auto');
            if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
            
            if (day !== currentDay) saveTripState();
        };
    }

    // Modal Listeners
    const shareBtn = document.getElementById('share-trip-btn');
    if (shareBtn) {
        shareBtn.onclick = () => {
            const url = new URL(window.location.href);
            url.searchParams.set('trip', tripId);
            const linkInput = document.getElementById('share-trip-link');
            if (linkInput) linkInput.value = url.toString();
            const modal = document.getElementById('share-trip-modal');
            if (modal) modal.classList.remove('opacity-0', 'pointer-events-none');
        };
    }

    const closeShareBtn = document.getElementById('close-share-modal');
    if (closeShareBtn) {
        closeShareBtn.onclick = () => {
            const modal = document.getElementById('share-trip-modal');
            if (modal) modal.classList.add('opacity-0', 'pointer-events-none');
        };
    }

    const copyBtn = document.getElementById('copy-share-link');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const input = document.getElementById('share-trip-link');
            if (input) {
                input.select();
                document.execCommand('copy');
                showToast('Link copied to clipboard!');
            }
        };
    }

    const leaveBtn = document.getElementById('leave-shared-trip');
    if (leaveBtn) {
        leaveBtn.onclick = () => { localStorage.removeItem('tripId'); window.location.href = window.location.pathname; };
    }

    const showUserIdBtn = document.getElementById('show-user-id');
    if (showUserIdBtn) {
        showUserIdBtn.onclick = () => {
            const display = document.getElementById('user-id-display');
            if (display) display.classList.toggle('hidden');
        };
    }

    // 3. Initial Static Render
    renderSidebarNav();
    renderActiveSection();
    
    // 4. Sync with Firebase Cloud
    setupFirebase();
};

// Reliable Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
