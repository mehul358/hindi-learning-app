import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- Trip Data ---
const itineraryData = [
    { date: "March 26, 2026", dayOfWeek: "Thursday", title: "Arrival & The Grand Brewery", location: "Lisbon", events: [
        { time: "11:40 AM", type: 'travel', icon: 'plane-landing', title: "Flight TP204 Arrives at LIS", description: "Take your pre-booked transfer to Martinhal Chiado. <strong>Family Note:</strong> Ensure your booking confirms car seats for the boys.", lat: 38.7742, lng: -9.1342, tags: ['Logistics'] },
        { time: "1:30 PM", type: 'rest', icon: 'key-round', title: "Settle in at Martinhal Chiado", description: "While waiting for the 3:00 PM check-in, drop your bags and get your bearings.", mapLink: "https://www.google.com/maps/search/Martinhal+Lisbon+Chiado", lat: 38.7086, lng: -9.1425, tags: ['Lodging', 'Kid-Friendly'] },
        { time: "3:30 PM", type: 'activity', icon: 'footprints', title: "Afternoon Session", activityOptions: [
            { name: 'Explore Chiado & Pastries', type: 'Must-Do', isMustDo: true, description: 'Take a gentle walk to Praça Luís de Camões, grab your first Portuguese pastry, and soak in the city vibes.' },
            { name: 'Praça das Flores Playground', type: 'Low Key', isMustDo: false, description: 'A quiet, shaded square with a small local playground and kiosks. Perfect for letting toddlers decompress after a flight.' }
        ], tips: [{ icon: 'footprints', text: 'Utilize the toddler carrier for Keev today if you walk around Chiado; the cobblestones and hills are tough on strollers.' }] },
        { time: "6:00 PM", type: 'dining', icon: 'utensils-crossed', title: "Dinner: Cervejaria Trindade", description: "Located steps from your hotel, this visually stunning former monastery is loud, chaotic, and beautiful—a low-stress, high-impact environment perfect for the first night.", lat: 38.7118, lng: -9.1418, diningOptions: [
            { name: 'Cervejaria Trindade', vibe: 'Historic & Lively', notes: 'Primary choice. Great atmosphere where kid noise blends right in.' },
            { name: 'Time Out Market Lisboa', vibe: 'Food Hall', notes: 'Alternate. Great food hall variety, very stroller friendly, but can be crowded.' }
        ] }
    ]},
    { date: "March 27, 2026", dayOfWeek: "Friday", title: "Tuk-Tuks & Modern Gastronomy", location: "Lisbon", events: [
        { time: "9:30 AM", type: 'activity', icon: 'sun', title: "Morning Session", activityOptions: [
            { name: 'Private Tuk-Tuk & Castle', type: 'Must-Do', isMustDo: true, description: 'Electric Tuk-Tuk Tour through Alfama, ending at São Jorge Castle. (Book skip-the-line tickets in advance).' },
            { name: 'Jardim da Estrela', type: 'Low Key', isMustDo: false, description: 'A gorgeous, massive park with duck ponds, an incredible playground, and a kiosk cafe where parents can grab coffee.' }
        ], lat: 38.7139, lng: -9.1335, tags: ['Kid-Favorite'] },
        { time: "12:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: Ofício", description: "Have your tuk-tuk driver or an Uber drop you near this trendy spot. Known for modern Portuguese cuisine. Going for lunch avoids the tighter evening crowds.", lat: 38.7093, lng: -9.1420 },
        { time: "3:00 PM", type: 'activity', icon: 'moon', title: "Afternoon Session", activityOptions: [
            { name: 'Alfama Walking Exploration', type: 'Must-Do', isMustDo: true, description: 'Navigate the winding, historic streets of Alfama on foot (carrier recommended over stroller here).' },
            { name: 'Hotel Playroom / Downtime', type: 'Low Key', isMustDo: false, description: 'Return to the apartment for naps and utilize the fantastic supervised kids playroom at Martinhal.' }
        ] },
        { time: "6:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Relaxed Dinner", description: "Have a relaxed dinner in your apartment utilizing the full kitchen, or a casual spot nearby.", lat: 38.7094, lng: -9.1417, diningOptions: [
            { name: 'Pizzaria Lisboa', vibe: 'Casual Sit-Down', notes: 'Alternate option by Chef José Avillez if you want an easy dinner out.' }
        ]}
    ]},
    { date: "March 28, 2026", dayOfWeek: "Saturday", title: "Belém's Age of Discoveries", location: "Lisbon (Belém)", events: [
        { time: "10:00 AM", type: 'activity', icon: 'sun', title: "Morning Session", activityOptions: [
            { name: 'Belém Tower & Monastery', type: 'Must-Do', isMustDo: true, description: 'Walk the flat, stroller-friendly waterfront past the Belém Tower and the stunning Jerónimos Monastery.' },
            { name: 'Jardim da Praça do Império', type: 'Low Key', isMustDo: false, description: 'Massive, flat formal gardens right in Belém with fountains and massive open spaces for the boys to run.' }
        ], lat: 38.6916, lng: -9.2160, tags: ['Stroller Friendly'] },
        { time: "12:30 PM", type: 'dining', icon: 'coffee', title: "Lunch: Pastéis de Belém", description: "Skip the takeout line and go through the entryway for faster table service to enjoy the famous warm custard tarts.", lat: 38.6975, lng: -9.2032 },
        { time: "2:30 PM", type: 'activity', icon: 'crown', title: "Afternoon Session", activityOptions: [
            { name: 'National Coach Museum', type: 'Must-Do', isMustDo: true, description: 'A guaranteed hit with Aarit and Keev; it features spectacular, fairytale-like royal carriages.' },
            { name: 'Monsanto Forest Park', type: 'Low Key', isMustDo: false, description: 'Head to Parque Recreativo do Alvito in Monsanto. It has a huge wooden playground, teepees, and a café.' }
        ], lat: 38.6968, lng: -9.1992 }
    ]},
    { date: "March 29, 2026", dayOfWeek: "Sunday", title: "Fairytale Sintra", location: "Sintra (Day Trip)", events: [
        { time: "9:00 AM", type: 'travel', icon: 'car', title: "Private Driver to Sintra", description: "A private driver avoids train/bus fatigue.", lat: 38.7963, lng: -9.3900 },
        { time: "10:00 AM", type: 'activity', icon: 'sun', title: "Morning Session", activityOptions: [
            { name: 'Quinta da Regaleira', type: 'Must-Do', isMustDo: true, description: 'The mystical grottoes, hidden tunnels, and initiation wells are a natural adventure playground for Aarit.' },
            { name: 'Parque da Liberdade', type: 'Low Key', isMustDo: false, description: 'Sintra\'s lovely public park. Lots of nature, winding paths, and far less crowded than the palaces.' }
        ], lat: 38.7963, lng: -9.3960, tags: ['Adventure'] },
        { time: "1:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: Tascantiga", description: "Located in Sintra's historic center, known for excellent tapas.", lat: 38.7963, lng: -9.3900 },
        { time: "3:00 PM", type: 'activity', icon: 'moon', title: "Afternoon Session", activityOptions: [
            { name: 'Sintra National Palace', type: 'Must-Do', isMustDo: true, description: 'Located right in town (no steep hikes required). Famous for its giant twin chimneys and historic interiors.' },
            { name: 'Village Café Relaxation', type: 'Low Key', isMustDo: false, description: 'Grab an outdoor table in the village, order traditional Queijadas, and let the kids play with small toys while you rest.' }
        ] }
    ]},
    { date: "March 30, 2026", dayOfWeek: "Monday", title: "Under the Sea", location: "Lisbon (Parque das Nações)", events: [
        { time: "10:00 AM", type: 'dining', icon: 'coffee', title: "Breakfast/Brunch", description: "Start the day with a great breakfast before heading to the modern expo district.", lat: 38.7634, lng: -9.0937 },
        { time: "11:00 AM", type: 'activity', icon: 'sun', title: "Morning Session", activityOptions: [
            { name: 'Lisbon Oceanarium', type: 'Must-Do', isMustDo: true, description: 'Consistently ranked among the best in the world. The massive central tank is mesmerizing for kids.' },
            { name: 'Jardim Garcia de Orta', type: 'Low Key', isMustDo: false, description: 'A beautiful botanical garden right next to the Oceanarium with wide, flat paths perfectly suited for strollers.' }
        ], tags: ['Kid-Favorite'] },
        { time: "1:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Waterfront Lunch", description: "Plenty of modern, casual, and family-friendly dining options line the riverfront in this district." },
        { time: "3:00 PM", type: 'activity', icon: 'moon', title: "Afternoon Session", activityOptions: [
            { name: 'Science Museum & Cable Car', type: 'Must-Do', isMustDo: true, description: 'Ride the Telecabine, then hit the Pavilhão do Conhecimento (Science Museum) which has an incredible dedicated toddler zone.' },
            { name: 'Maritime Playgrounds', type: 'Low Key', isMustDo: false, description: 'Walk the boardwalks. There are several amazing, free maritime-themed playgrounds right along the river.' }
        ] }
    ]},
    { date: "March 31, 2026", dayOfWeek: "Tuesday", title: "Journey to the Algarve", location: "Lisbon to Algarve", events: [
        { time: "9:30 AM", type: 'travel', icon: 'car', title: "Pick up Rental Car", description: "Pick up your rental car in Lisbon. Ensure your pre-booked booster (Aarit) and toddler seat (Keev) are installed securely.", lat: 38.7742, lng: -9.1342, tags: ['Logistics'] },
        { time: "10:30 AM", type: 'activity', icon: 'sun', title: "Morning Session (Drive South)", activityOptions: [
            { name: 'Direct Drive to Algarve', type: 'Must-Do', isMustDo: true, description: 'Power through the 2.5 hour drive down the A2 while the kids (hopefully) take a morning nap.' },
            { name: 'Pitstop at Alcácer do Sal', type: 'Low Key', isMustDo: false, description: 'Stop halfway at this historic town. Take a 30-minute riverside walk to stretch legs and burn energy before getting back in the car.' }
        ] },
        { time: "3:00 PM", type: 'rest', icon: 'key-round', title: "Check-in at VILA VITA Parc", description: "Settle into your beautiful coastal resort.", lat: 37.1017, lng: -8.3813, tags: ['Lodging'] },
        { time: "4:00 PM", type: 'activity', icon: 'moon', title: "Afternoon Session", activityOptions: [
            { name: 'Resort Beach & Pools', type: 'Must-Do', isMustDo: true, description: 'Hit the heated pools or walk down to the resort’s sheltered cove beach for your first taste of the Algarve.' },
            { name: 'Vila Vita Kids’ Park', type: 'Low Key', isMustDo: false, description: 'Let the boys loose on the resort’s playground structures while you and your wife grab a coffee and relax.' }
        ] },
        { time: "6:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Dinner: Vila Vita Biergarten", description: "Bavarian food, casual and lively, located right on the resort grounds.", lat: 37.1126, lng: -8.3842 }
    ]},
    { date: "April 1, 2026", dayOfWeek: "Wednesday", title: "Caves, Coasts, & Crafts", location: "Algarve", events: [
        { time: "9:30 AM", type: 'activity', icon: 'sun', title: "Morning Session", activityOptions: [
            { name: 'Benagil Cave Boat Tour', type: 'Must-Do', isMustDo: true, description: 'Pre-booked boat tour. (Choose a stable catamaran over a speedboat for safety and comfort with the boys).' },
            { name: 'Praia de Carvoeiro Beach Play', type: 'Low Key', isMustDo: false, description: 'A beach right in the town square. Zero steep staircases to navigate, perfect for easy sandcastle building.' }
        ], lat: 37.0872, lng: -8.4258, tags: ['Adventure'] },
        { time: "12:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch in Carvoeiro", description: "Grab lunch at one of the many cafes overlooking the beach." },
        { time: "2:30 PM", type: 'activity', icon: 'moon', title: "Afternoon Session", activityOptions: [
            { name: 'Porches Pottery Workshop', type: 'Must-Do', isMustDo: true, description: 'A wonderful, tactile activity. Watch the artisans at work, and let Aarit and Keev paint their own ceramics.' },
            { name: 'Carvoeiro Boardwalk', type: 'Low Key', isMustDo: false, description: 'A flat, safe, and stunning wooden boardwalk built over the cliffs. Extremely stroller friendly and highly scenic.' }
        ], lat: 37.1265, lng: -8.3995 }
    ]},
    { date: "April 2, 2026", dayOfWeek: "Thursday", title: "Anniversary Celebration & Lagos", location: "Algarve", events: [
        { time: "10:00 AM", type: 'activity', icon: 'sun', title: "Morning Session", activityOptions: [
            { name: 'Lagos Grotto Tour', type: 'Must-Do', isMustDo: true, description: 'Drive to Lagos. Take a short 30-45 minute small grotto boat tour right from the marina to go inside the rock arches.' },
            { name: 'Meia Praia (Lagos Beach)', type: 'Low Key', isMustDo: false, description: 'One of the longest, widest, and flattest beaches in the Algarve. Uncrowded and perfect for toddlers to run wild.' }
        ], lat: 37.1085, lng: -8.6734 },
        { time: "1:00 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: Prato Feio (Almancil)", description: "Stop on the drive back for incredible, rustic Portuguese soul food in a welcoming, family-friendly environment.", lat: 37.0850, lng: -8.0280 },
        { time: "3:30 PM", type: 'activity', icon: 'moon', title: "Afternoon Session", activityOptions: [
            { name: 'Anniversary Photos/Beach', type: 'Must-Do', isMustDo: true, description: 'Take some dedicated family photos on the resort beach to commemorate your anniversary trip.' },
            { name: 'Quiet Pool Time', type: 'Low Key', isMustDo: false, description: 'Take advantage of the resort pools or supervised kid activities to rest up before your big dinner.' }
        ], lat: 37.1017, lng: -8.3813 },
        { time: "7:00 PM", type: 'dining', icon: 'glass-water', title: "Anniversary Dinner: Praia Dourada", description: "Celebrate your anniversary! It’s a chic, upscale restaurant located directly on the resort's beach. You can enjoy wonderful food while Aarit and Keev play safely in the sand right next to your table.", lat: 37.1017, lng: -8.3813, tags: ['Special Event', 'Kid-Friendly'] }
    ]},
    { date: "April 3, 2026", dayOfWeek: "Friday", title: "Flamingos & Sunsets", location: "Algarve", events: [
        { time: "10:00 AM", type: 'activity', icon: 'sun', title: "Morning Session", activityOptions: [
            { name: 'Ludo Trail (Ria Formosa)', type: 'Must-Do', isMustDo: true, description: 'A flat, easy stroller walk through the wetlands to spot flamingos and fiddler crabs.' },
            { name: 'Parque das Figuras (Faro)', type: 'Low Key', isMustDo: false, description: 'A large urban park near Faro with wide open spaces and a great playground for the kids.' }
        ], lat: 37.0211, lng: -7.9866, tags: ['Outdoors', 'Stroller Friendly'] },
        { time: "1:00 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: Austa (Almancil)", description: "A high-end, farm-to-table culinary experience. Note: Children under 7 are only permitted during the day, making lunch perfect.", lat: 37.0850, lng: -8.0280 },
        { time: "4:00 PM", type: 'activity', icon: 'moon', title: "Afternoon Session", activityOptions: [
            { name: 'Sunset at Mirador Bar', type: 'Must-Do', isMustDo: true, description: 'Located at Pine Cliffs Resort. Let the kids play on the grassy lawn while you take in the cliff views with a drink.' },
            { name: 'Mini-Golf / Gardens', type: 'Low Key', isMustDo: false, description: 'Play a round of family mini-golf near Almancil, or simply stroll through your own resort\'s lush gardens.' }
        ], lat: 37.0950, lng: -8.1750 },
        { time: "7:30 PM", type: 'dining', icon: 'utensils', title: "Dinner: A Quinta", description: "Known for its excellent menu and desserts.", lat: 37.0850, lng: -8.0280 }
    ]},
    { date: "April 4, 2026", dayOfWeek: "Saturday", title: "Smooth Departure", location: "Algarve to NYC", events: [
        { time: "8:00 AM", type: 'travel', icon: 'car', title: "Drive to Faro Airport (FAO)", description: "Enjoy a final resort breakfast, then drive to FAO and return the rental car.", lat: 37.0144, lng: -7.9659, tags: ['Logistics'] },
        { time: "11:15 AM", type: 'travel', icon: 'plane-takeoff', title: "Flight TP1902 to Lisbon", description: "Short hopper flight up to LIS.", lat: 38.7742, lng: -9.1342 },
        { time: "1:00 PM", type: 'activity', icon: 'coffee', title: "Lisbon Layover Options", activityOptions: [
            { name: 'Airport Lounge', type: 'Must-Do', isMustDo: true, description: 'Book lounge access in advance. Get comfortable seating, free food, and a quiz space away from terminal chaos.' },
            { name: 'Airport Play Area', type: 'Low Key', isMustDo: false, description: 'Utilize the Lisbon airport children’s play area to let the boys burn out their energy before the transatlantic flight.' }
        ] },
        { time: "5:55 PM", type: 'travel', icon: 'plane', title: "Flight TP203 to Newark", description: "Safe travels home!" }
    ]}
];

let checklists = {
    "Booking Priorities": [
        { text: "Multi-city flights (NYC→LIS, FAO→NYC)", checked: true },
        { text: "Martinhal Chiado (5 nights)", checked: true },
        { text: "Vila Vita Parc (4 nights)", checked: true },
        { text: "Rental car pick-up in LIS, drop-off in FAO (with 2 car seats)", checked: false },
        { text: "Private airport transfer in Lisbon (request boosters/seats)", checked: false },
        { text: "Anniversary Dinner Reservation (Praia Dourada)", checked: false }
    ],
    "Kid Essentials (Aarit 5½, Keev 3)": [
        { text: "Lightweight Travel Stroller (for Keev/Belém)", checked: false },
        { text: "Toddler Carrier (helpful for Sintra/Chiado)", checked: false },
        { text: "Healthy/Organic snacks for travel days", checked: false },
        { text: "Tablet/Headphones pre-loaded with shows", checked: false },
        { text: "Small travel activities/coloring books", checked: false }
    ],
    "General Packing": [
        { text: "Passports (valid 6+ months from April 2026)", checked: false },
        { text: "EU Plug adapters (Type C/F)", checked: false },
        { text: "Lightweight rain jackets (March/April weather)", checked: false },
        { text: "Comfortable, sturdy walking shoes (cobblestones!)", checked: false },
        { text: "Swimsuits & Sunscreen (for Algarve pools/beach)", checked: false }
    ]
};

const travelGuide = {
    knowBeforeYouGo: { title: 'Family Travel in Portugal', points: [
        { icon: 'baby', title: 'Kid-Friendly Culture', text: 'Portugal is exceptionally welcoming to children. It is completely normal for kids to be in restaurants later in the evening. Locals will often go out of their way to accommodate Aarit and Keev.' },
        { icon: 'footprints', title: 'Navigating Cobblestones', text: 'Lisbon is famously hilly and paved with calçada (cobblestones). A sturdy, lightweight travel stroller is crucial, but a baby carrier is highly recommended for exploring castles, Chiado, and Sintra.' },
        { icon: 'salad', title: 'Food & Dining', text: 'Portuguese cuisine relies heavily on fresh, high-quality ingredients (olive oil, fresh fish, simple meats). You will easily find healthy options without artificial additives for the kids. "Sopa de legumes" (vegetable soup) is on almost every menu and is a healthy, kid-approved staple.' },
        { icon: 'car', title: 'Car Seats', text: 'By law, children under 12 or under 135cm must use an appropriate child seat. Ensure all transfers and rental cars are booked explicitly with a toddler seat for Keev and a booster for Aarit.' }
    ]}
};

const sectionTitles = {
    'itinerary': 'Daily Itinerary',
    'map': 'Interactive Route Map',
    'bookings': 'Budget & Expenses',
    'checklists': 'Preparation Checklists',
    'guide': 'Family Travel Guide'
};

// --- Core State ---
let userId = null;
let currentDay = 0;
let currentSection = 'itinerary';
let hasInitialDataLoaded = false;
let tripStateUnsubscribe = null;
let eventNotes = {};
let userExpenses = {};
let mapInstance = null;
let mapMarkers = [];
let db = null;
let auth = null;

const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-portugal-trip';

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
    document.getElementById('toast-message').textContent = msg;
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

    document.querySelectorAll('nav > div:first-child > .nav-link').forEach(btn => {
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
            <h2 class="font-outfit text-4xl font-bold text-slate-800 tracking-tight">${dayData.title}</h2>
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
                    tipsHtml = `<div class="mt-3 space-y-2">` + 
                        event.tips.map(tip => `
                        <div class="flex items-start bg-yellow-50 p-2.5 rounded-lg border border-yellow-100">
                            <i data-lucide="${tip.icon}" class="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5"></i>
                            <span class="text-xs text-yellow-800 font-medium leading-relaxed">${tip.text}</span>
                        </div>
                        `).join('') + 
                    `</div>`;
                }

                return `
                <div class="relative flex items-start group">
                    <div class="absolute left-6 -translate-x-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-white border-4 border-slate-50 shadow-sm z-10 transition-transform group-hover:scale-110">
                        <div class="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                            <i data-lucide="${event.icon}" class="w-4 h-4"></i>
                        </div>
                    </div>
                    
                    <div class="ml-16 w-full">
                        <div class="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
                            
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-xs font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-1 rounded">${event.time}</span>
                            </div>
                            
                            <h3 class="text-xl font-outfit font-bold text-slate-800 mb-2">${event.title}</h3>
                            
                            ${event.description ? `<p class="text-slate-600 text-sm leading-relaxed mb-3">${event.description}</p>` : ''}
                            
                            ${event.activityOptions ? `
                                <div class="mt-4 grid gap-3 text-left">
                                    ${event.activityOptions.map(a => `
                                        <div class="p-3.5 rounded-xl ${a.isMustDo ? 'bg-teal-50/50 border-teal-200' : 'bg-slate-50 border-slate-200'} border">
                                            <div class="flex justify-between items-start mb-1.5">
                                                <span class="font-bold ${a.isMustDo ? 'text-teal-900' : 'text-slate-800'} text-sm flex items-center">
                                                    ${a.isMustDo ? '<i data-lucide="star" class="w-4 h-4 mr-1.5 text-teal-600 fill-teal-600"></i>' : '<i data-lucide="leaf" class="w-4 h-4 mr-1.5 text-slate-400"></i>'}
                                                    ${a.name}
                                                </span>
                                                <span class="text-[10px] ${a.isMustDo ? 'text-teal-700 bg-teal-100/50 border-teal-200' : 'text-slate-500 bg-white border-slate-200'} font-bold uppercase tracking-wider px-2 py-0.5 rounded border">${a.type}</span>
                                            </div>
                                            <p class="text-xs ${a.isMustDo ? 'text-teal-800' : 'text-slate-600'} leading-relaxed">${a.description}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${event.diningOptions ? `
                                <div class="mt-4 grid gap-3 text-left">
                                    ${event.diningOptions.map(d => `
                                        <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div class="flex justify-between items-start mb-1">
                                                <span class="font-bold text-slate-800 text-sm">${d.name}</span>
                                                <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-100">${d.vibe}</span>
                                            </div>
                                            <p class="text-xs text-slate-500">${d.notes}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${tipsHtml}
                            ${tagsHtml}
                            
                            <div class="mt-4 pt-4 border-t border-slate-50 text-left">
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
    const categories = [
        { key: 'flights', label: 'Flights (NYC to LIS/FAO)', estimate: 2400 },
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
                <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-4 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    <i data-lucide="circle-dollar-sign" class="w-4 h-4"></i>
                </div>
                <div>
                    <span class="text-sm font-bold text-slate-800 block">${c.label}</span>
                    <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Est: $${c.estimate}</span>
                </div>
            </div>
            <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input type="number" data-key="${c.key}" value="${val}" class="w-28 pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all expense-input" placeholder="0">
            </div>
        </div>`;
    }).join('');

    content.innerHTML = `
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-2xl mx-auto">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-2xl font-outfit font-bold text-slate-800">Trip Budget</h2>
                    <p class="text-sm text-slate-500 mt-1">Track actual costs against estimates</p>
                </div>
                <div class="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
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
        </div>`;

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
                <p class="text-slate-500 mt-2 font-medium">Tips for navigating Portugal with a 3 & 5 year old</p>
            </div>
            
            <div class="space-y-8">
                ${travelGuide.knowBeforeYouGo.points.map(p => `
                    <div class="flex items-start space-x-5 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div class="bg-white p-3 rounded-xl text-teal-600 shadow-sm border border-slate-100 flex-shrink-0">
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
    document.getElementById('mobile-header-title').textContent = sectionTitles[currentSection] || 'Trip';
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

// --- Firebase Sync ---
const saveTripState = async () => {
    if (!userId || !db) return;
    const docRef = doc(db, "artifacts", appId, "public", "data", "trips", tripId);
    try {
        await setDoc(docRef, {
            currentDay,
            eventNotes,
            userExpenses,
            checklists: JSON.parse(JSON.stringify(checklists)),
            lastUpdated: new Date().toISOString()
        }, { merge: true });
        showToast();
    } catch (e) { console.error("Save Error:", e); }
};

const startTripStateListener = () => {
    if (!userId || !db) return;
    const docRef = doc(db, "artifacts", appId, "public", "data", "trips", tripId);
    
    tripStateUnsubscribe = onSnapshot(docRef, (docSnap) => {
        let data = docSnap.exists() ? docSnap.data() : {};
        
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
            if (currentSection === 'checklists') renderChecklists();
        }
    }, (error) => console.error("Firestore Listen Error:", error));
};

const setupFirebase = async () => {
    try {
        let config = null;
        if (typeof window.__firebase_config !== 'undefined') {
            config = typeof window.__firebase_config === 'string' ? JSON.parse(window.__firebase_config) : window.__firebase_config;
        }
        
        if (config && config.apiKey) {
            const app = initializeApp(config);
            db = getFirestore(app);
            auth = getAuth(app);

            if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
                await signInWithCustomToken(auth, window.__initial_auth_token).catch(() => signInAnonymously(auth));
            } else {
                await signInAnonymously(auth);
            }

            onAuthStateChanged(auth, (user) => {
                if (user) {
                    userId = user.uid;
                    const display = document.getElementById('user-id-display');
                    if (display) display.textContent = `UID: ${userId.substring(0,8)}...`;
                    startTripStateListener();
                } else {
                    userId = null;
                }
            });
        }
    } catch (e) { console.warn("Firebase Setup Failed:", e); }
};

// --- Main Init ---
const initApp = () => {
    console.log("Lisbon Trip App Initializing...");

    // Event Listeners for Nav
    document.getElementById('open-sidebar').onclick = () => {
        document.getElementById('sidebar').classList.remove('-translate-x-full');
        document.getElementById('sidebar-overlay').classList.remove('opacity-0', 'pointer-events-none');
    };
    const closeSidebar = () => {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('sidebar-overlay').classList.add('opacity-0', 'pointer-events-none');
    };
    document.getElementById('sidebar-overlay').onclick = closeSidebar;
    document.getElementById('close-sidebar').onclick = closeSidebar;

    document.querySelector('nav').onclick = (e) => {
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

    // Modal Listeners
    document.getElementById('share-trip-btn').onclick = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('trip', tripId);
        document.getElementById('share-trip-link').value = url.toString();
        document.getElementById('share-trip-modal').classList.remove('opacity-0', 'pointer-events-none');
    };
    document.getElementById('close-share-modal').onclick = () => document.getElementById('share-trip-modal').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('copy-share-link').onclick = () => {
        const input = document.getElementById('share-trip-link');
        input.select();
        document.execCommand('copy');
        showToast('Link copied to clipboard!');
    };
    document.getElementById('leave-shared-trip').onclick = () => { localStorage.removeItem('tripId'); window.location.href = window.location.pathname; };
    document.getElementById('show-user-id').onclick = () => document.getElementById('user-id-display').classList.toggle('hidden');

    // Initial Static Render
    renderSidebarNav();
    renderActiveSection();
    
    // Sync with Firebase
    setupFirebase();
};

// Reliable Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
