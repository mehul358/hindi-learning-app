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
            { name: "Mehul Agarwal", ticket: "047 2199825211" },
            { name: "Nehal Agarwal", ticket: "047 2199825209" },
            { name: "Aarit Agarwal", ticket: "047 2199825210" },
            { name: "Keev Agarwal", ticket: "047 2199825208" }
        ],
        schedule: [
            { date: "Thursday, March 26, 2026", flight: "TP204", route: "Newark (EWR) → Lisbon (LIS)", time: "Dep: 12:55 AM | Arr: 11:40 AM", label: "Outbound" },
            { date: "Saturday, April 4, 2026", flight: "TP1902", route: "Faro (FAO) → Lisbon (LIS)", time: "Dep: 11:15 AM | Arr: 12:10 PM", label: "Inter-Portugal" },
            { date: "Saturday, April 4, 2026", flight: "TP203", route: "Lisbon (LIS) → Newark (EWR)", time: "Dep: 5:55 PM | Arr: 9:00 PM", label: "Return" }
        ]
    },
    hotels: [
        {
            name: "Martinhal Lisbon Chiado Family Suites", location: "Lisbon",
            dates: "March 26 – March 31, 2026 (5 Nights)",
            bookingId: "DSR0254B8JUXF (PIN: 190696)",
            roomType: "1 Bedroom Superior Deluxe Apartment (Breakfast included)",
            checkIn: "3:00 PM (Requested early check-in at 11:45 AM)", checkOut: "12:00 PM",
            benefits: "Includes Toddler Crib."
        },
        {
            name: "Vila Vita Parc Resort & Spa", location: "Algarve",
            dates: "March 31 – April 4, 2026 (4 Nights)",
            bookingId: "9076038703600",
            roomType: "Family Suite (Oasis)",
            checkIn: "3:00 PM (12:00 PM if available)", checkOut: "12:00 PM (Guaranteed 4:00 PM late check-out)",
            benefits: "Daily breakfast for two, $100 Property credit, Complimentary Wi-Fi, and Room upgrade (if available)."
        }
    ],
    transport: {
        type: "Rental Car (Rent Car 4 Less via Zest)",
        pickup: "Tuesday, March 31, 2026 at 10:00 AM (Lisbon)",
        dropoff: "Saturday, April 4, 2026 at 09:00 AM (Faro Airport - FAO)",
        plan: "Skoda Kamiq or similar (Automatic). Includes 1 Child Seat, 1 Booster Seat, and Toll Transponder. Ref: BFH972"
    },
    sintraDayTrip: {
        type: "Private Day Trip (MyDaytrip)",
        bookingRef: "3K7RFY5D",
        date: "Monday, March 30, 2026",
        price: "€200 (Prepaid)",
        vehicle: "1x MPV (Compact, e.g., Volkswagen Touran)",
        passengers: "4 (including 2 children with car seats)",
        schedule: "08:30 AM (Pick-up) → 02:05 PM (Est. Drop-off)",
        route: "Lisbon → Queluz Palace (15m stop) → Sintra (4h stop) → Lisbon",
        pickup: "Martinhal Lisbon Chiado Luxury Hotel & Apartments (Lobby)",
        dropoff: "Martinhal Lisbon Chiado Luxury Hotel & Apartments",
        contact: "daytrip@daytrip.com | +1 628 288 2020"
    },
    bookingLinks: [
        { day: "Day 1 (Mar 26)", name: "Cervejaria Trindade (Dinner)", method: "Official Website or +351 213 423 506", note: "Excellent for your first night; very close to Martinhal." },
        { day: "Day 2 (Mar 27)", name: "Ofício (Lunch)", method: "TheFork or +351 910 456 440", note: "Highly popular. Book the 12:30 PM slot if available to stay on schedule for the Science Museum." },
        { day: "Day 2 (Mar 27)", name: "Pizzaria Lisboa (Dinner)", method: "joseavillez.pt or +351 211 554 945", note: "" },
        { day: "Day 4 (Mar 29)", name: "A Praça (Lunch at LX Factory)", method: "Official Website or +351 213 621 000", note: "" },
        { day: "Day 4 (Mar 29)", name: "Pizzeria ZeroZero (Dinner)", method: "Official Website or +351 213 420 066", note: "Request the Garden Terrace in the notes." },
        { day: "Day 5 (Mar 30)", name: "Tascantiga (Sintra Lunch)", method: "Phone only (+351 219 243 242) or email tascantiga@gmail.com", note: "Very welcoming to children; serves high-quality tapas." },
        { day: "Day 5 (Mar 30)", name: "Bairro do Avillez - Páteo (Farewell Dinner)", method: "joseavillez.pt or +351 215 830 290", note: "Crucial: Specify 'The Páteo' for the grander, family-friendly hall." },
        { day: "Day 8 (Apr 2)", name: "A Forja (Lagos Lunch)", method: "Walk-in or +351 282 768 588", note: "Great local spot in Lagos to avoid driving back to Almancil." },
        { day: "Day 8 (Apr 2)", name: "Praia Dourada (Anniversary Dinner)", method: "SevenRooms or through Vila Vita Concierge", note: "Crucial Note: '10th Anniversary - Request table on the sand edge.'" },
        { day: "Day 9 (Apr 3)", name: "Austa (Lunch)", method: "Official Website or WhatsApp +351 965 896 278", note: "Children under 7 only permitted for lunch/brunch." }
    ],
    activities: [
        { name: "Sintra Private Day Trip (Mar 30)", details: "MyDaytrip - Ref: 3K7RFY5D" },
        { name: "Tuk-Tuk Tour (Mar 27)", details: "Eco Tuk Tours" },
        { name: "Benagil Cave Tour (Apr 1)", details: "CarvoeiroCaves (Explicitly provides toddler life jackets)" },
        { name: "Tile Painting (Mar 28)", details: "Art of Azulejo (Email or book via Fever)" },
        { name: "Lagos Grotto Tour (Apr 2)", details: "Book at Lagos Marina" }
    ]
};

// --- Trip Data (Massively Detailed Version) ---
const itineraryData = [
    { date: "March 26, 2026", dayOfWeek: "Thursday", title: "Arrival & The Grand Hall", location: "Lisbon", events: [
        { time: "11:40 AM", type: 'travel', icon: 'plane-landing', title: "Flight TP204 Arrives at LIS", description: "Welcome to Portugal! Clear customs and grab your luggage.", lat: 38.7742, lng: -9.1342, tags: ['Logistics'],
          tips: [
              { icon: 'alert-triangle', text: 'Watch Out: Do not just grab a standard taxi. You must pre-book a private transfer ensuring an ISOFIX forward-facing seat for Keev (3) and a booster for Aarit (5).' }
          ] 
        },
        { time: "1:30 PM", type: 'rest', icon: 'key-round', title: "Settle in at Martinhal Chiado", description: "Drop your bags. Official check-in is 3:00 PM, but you can utilize the hotel facilities immediately.", mapLink: "https://www.google.com/maps/search/Martinhal+Lisbon+Chiado", lat: 38.7086, lng: -9.1425, tags: ['Lodging', 'Kid-Friendly'],
          tips: [
              { icon: 'info', text: 'Baby Concierge: Ask the front desk for anything you forgot (bottle warmers, potties, specific toddler gear).' }
          ] 
        },
        { time: "3:30 PM", type: 'activity', icon: 'footprints', title: "Afternoon Session: Stretch Your Legs", activityOptions: [
            { name: 'Praça do Comércio & Riverfront', type: 'Must-Do', isMustDo: true, description: 'Take a flat, easy walk down to the massive Praça do Comércio square. Let the boys run around the open space and watch the boats on the Tagus River.' },
            { name: 'Praça das Flores Playground', type: 'Low Key', isMustDo: false, description: 'A quiet, shaded square with a small local playground and kiosks. Perfect for letting toddlers decompress after a flight without crowds.' }
        ], lat: 38.7075, lng: -9.1364,
          tips: [
              { icon: 'footprints', text: 'Footwear Warning: The Chiado district is extremely hilly with slick calçada (cobblestones). Use the toddler carrier for Keev today; strollers are difficult here.' }
          ] 
        },
        { time: "6:00 PM", type: 'dining', icon: 'utensils-crossed', title: "Dinner: Cervejaria Trindade", description: "Located steps from your hotel. It is a visually stunning former monastery, famous for steak and seafood.", lat: 38.7118, lng: -9.1418, diningOptions: [
            { name: 'Cervejaria Trindade', vibe: 'Historic & Lively', notes: 'Primary choice. It’s loud, grand, and high-energy—perfect because if the kids are loud or cranky from jetlag, it will blend right in.' },
            { name: 'Time Out Market Lisboa', vibe: 'Food Hall', notes: 'Alternate. Vibrant and flat (stroller friendly), but can be overwhelming on Day 1.' }
        ],
          tips: [
              { icon: 'utensils', text: 'Order the "Bife à Trindade" (steak) for yourselves, and simple grilled fish or croquettes for the boys.' }
          ]
        }
    ]},
    { date: "March 27, 2026", dayOfWeek: "Friday", title: "Science, Tuk-Tuks & Hidden Playgrounds", location: "Lisbon", events: [
        { time: "9:30 AM", type: 'activity', icon: 'microscope', title: "Morning Session: Interactive Play", activityOptions: [
            { name: 'Pavilhão do Conhecimento (Science Museum)', type: 'Must-Do', isMustDo: true, description: 'Located in Parque das Nações. 100% interactive for toddlers. Aarit will love the physics exhibits, and Keev will love the water-play areas.' },
            { name: 'Jardim da Estrela', type: 'Low Key', isMustDo: false, description: 'A gorgeous, massive park with duck ponds, an incredible playground, and a kiosk cafe where parents can grab coffee.' }
        ], lat: 38.7622, lng: -9.0950, tags: ['Kid-Favorite'],
          tips: [
              { icon: 'clock', text: 'Hit the Science museum right when it opens while energy is high and crowds are low.' }
          ]
        },
        { time: "12:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: Ofício", description: "Take an Uber back toward Chiado to this trendy, modern spot.", lat: 38.7093, lng: -9.1420,
          tips: [
              { icon: 'star', text: 'Must Order: Their famous savory baked cheese tart is legendary.' }
          ]
        },
        { time: "3:00 PM", type: 'activity', icon: 'truck', title: "Afternoon Session: Alfama & The Castle", activityOptions: [
            { name: 'Private Tuk-Tuk & São Jorge Castle', type: 'Must-Do', isMustDo: true, description: 'Hire a private electric Tuk-Tuk to navigate the steep hills of Alfama. Have them drop you right at the Castle entrance.' },
            { name: 'Hotel Playroom / Downtime', type: 'Low Key', isMustDo: false, description: 'If the jetlag hits hard, return to Martinhal and utilize the fantastic supervised kids playroom so you and Nehal can rest.' }
        ], lat: 38.7139, lng: -9.1335,
          tips: [
              { icon: 'alert-circle', text: 'Castle Hack #1: Buy skip-the-line tickets online.' },
              { icon: 'shield-check', text: 'Castle Hack #2: If there is still a line, look for the "Family Priority" lane. Families with children under 5 legally get to skip the main queue in Portugal!' },
              { icon: 'map-pin', text: 'Secret Playground: After the castle, ask your driver to stop at Miradouro do Recolhimento. It’s a hidden, gated playground with orange trees and peacocks where the kids can run safely.' }
          ] 
        },
        { time: "6:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Dinner: Pizzaria Lisboa", description: "By famous Chef José Avillez. High-end, delicious pizza in an environment that is very welcoming to kids.", lat: 38.7094, lng: -9.1417 }
    ]},
    { date: "March 28, 2026", dayOfWeek: "Saturday", title: "Tiles & Royal Carriages", location: "Lisbon (Belém)", events: [
        { time: "10:00 AM", type: 'activity', icon: 'brush', title: "Morning Session: Hands-On Art", activityOptions: [
            { name: 'Art of Azulejo Workshop', type: 'Must-Do', isMustDo: true, description: 'Book a family tile-painting workshop. Aarit (5) is the perfect age to focus on painting a traditional tile, and Keev can play with clay/paint. A wonderful tactile break.' },
            { name: 'Jardim da Praça do Império', type: 'Low Key', isMustDo: false, description: 'Massive, flat formal gardens right in Belém with grand fountains and massive open spaces for the boys to run.' }
        ], lat: 38.6916, lng: -9.2160, tags: ['Stroller Friendly', 'Tactile'] },
        { time: "12:30 PM", type: 'dining', icon: 'coffee', title: "Lunch: Pastéis de Belém", description: "The birthplace of Portugal's famous custard tarts. Also serves savory lunch items.", lat: 38.6975, lng: -9.2032,
          tips: [
              { icon: 'alert-triangle', text: 'Watch Out: Do NOT stand in the massive takeout line outside. Walk past it, go deep inside the building, and sit in the labyrinth of cafe rooms for much faster table service.' }
          ]
        },
        { time: "2:30 PM", type: 'activity', icon: 'crown', title: "Afternoon Session: Fairytale Transport", activityOptions: [
            { name: 'National Coach Museum', type: 'Must-Do', isMustDo: true, description: 'A guaranteed hit with Aarit and Keev; it features spectacular, 300-year-old royal carriages that look straight out of Cinderella.' },
            { name: 'Belém Waterfront Walk', type: 'Low Key', isMustDo: false, description: 'Walk the perfectly flat, wide promenade along the river to see the Discoveries Monument and Belém Tower. Very stroller friendly.' }
        ], lat: 38.6968, lng: -9.1992 },
        { time: "6:30 PM", type: 'dining', icon: 'utensils', title: "Dinner: Ibo", description: "Located right on the waterfront (Cais do Sodré area). Sophisticated dining, but spacious enough for a family.", lat: 38.7061, lng: -9.1436 }
    ]},
    { date: "March 29, 2026", dayOfWeek: "Sunday", title: "Sunday Vibe & Under the Sea", location: "Lisbon", events: [
        { time: "9:30 AM", type: 'activity', icon: 'fish', title: "Morning Session: The Oceanarium", activityOptions: [
            { name: 'Oceanário de Lisboa', type: 'Must-Do', isMustDo: true, description: 'Take an Uber to Parque das Nações. This is consistently ranked as one of the best aquariums globally. The massive central tank will mesmerize the boys.' },
            { name: 'Maritime Playgrounds', type: 'Low Key', isMustDo: false, description: 'Walk the waterfront boardwalks outside the aquarium. There are several amazing, free maritime-themed playgrounds right along the river.' }
        ], lat: 38.7634, lng: -9.0937, tags: ['Kid-Favorite'],
          tips: [
              { icon: 'ticket', text: 'Book Oceanarium tickets online in advance. It is completely flat and stroller accessible.' }
          ]
        },
        { time: "12:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: D'Bacalhau", description: "Casual, bustling waterfront restaurant in Parque das Nações known for excellent Portuguese food.", lat: 38.7663, lng: -9.0945 },
        { time: "3:00 PM", type: 'activity', icon: 'shopping-bag', title: "Afternoon Session: Sunday Markets", activityOptions: [
            { name: 'LX Factory Sunday Market', type: 'Must-Do', isMustDo: true, description: 'Take an Uber to Alcântara. It is a no-car zone filled with street art, quirky shops, and a vibrant Sunday market. Very visually stimulating.' },
            { name: 'Jardim da Estrela', type: 'Low Key', isMustDo: false, description: 'If the kids just need to play, skip LX Factory and head to this park. It is considered Lisbon’s best playground for young children.' }
        ], lat: 38.7032, lng: -9.1787 },
        { time: "6:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Dinner: Pizzeria ZeroZero", description: "Located in Príncipe Real. Famous for its fantastic outdoor garden patio where kids have space to breathe while you enjoy great food.", lat: 38.7164, lng: -9.1477 }
    ]},
    { date: "March 30, 2026", dayOfWeek: "Monday", title: "Fairytale Sintra (Crowd Avoidance)", location: "Sintra (Day Trip)", events: [
        { time: "08:30 AM", type: 'travel', icon: 'car', title: "Private Driver Pick-up (MyDaytrip)", description: "Meet your driver in the Martinhal Chiado lobby. Ref: 3K7RFY5D. Car seats for Aarit and Keev included.", lat: 38.7086, lng: -9.1425,
          tips: [
              { icon: 'info', text: 'Contact: daytrip@daytrip.com | +1 628 288 2020. Trip is prepaid.' }
          ]
        },
        { time: "09:00 AM", type: 'activity', icon: 'castle', title: "Sintra Sightseeing Route", description: "Lisbon → Queluz Palace (15m stop) → Sintra (4h stop) → Lisbon.", lat: 38.7507, lng: -9.2590, activityOptions: [
            { name: 'Pena Palace (Exteriors Only)', type: 'Must-Do', isMustDo: true, description: 'The iconic colorful castle. SKIP the interior rooms—they are a nightmare with toddlers. The exterior terraces are the best part anyway.' },
            { name: 'Quinta da Regaleira', type: 'Must-Do', isMustDo: true, description: 'Natural adventure playground with mystical grottoes and hidden tunnels.' }
        ], tags: ['Adventure'],
          tips: [
              { icon: 'footprints', text: 'Warning: Leave the stroller in the car today. Sintra requires walking up steep paths. A toddler carrier for Keev is essential.' }
          ]
        },
        { time: "1:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: Tascantiga", description: "Located in Sintra's historic center, known for excellent tapas and quick service.", lat: 38.7963, lng: -9.3900 },
        { time: "2:05 PM", type: 'travel', icon: 'home', title: "Estimated Return to Lisbon", description: "Drop-off back at Martinhal Lisbon Chiado.", lat: 38.7086, lng: -9.1425 },
        { time: "3:30 PM", type: 'activity', icon: 'leaf', title: "Afternoon Session: Open Space", activityOptions: [
            { name: 'Monserrate Park', type: 'Must-Do', isMustDo: true, description: 'Botanical garden with gigantic rolling lawns. Let the boys run wild.' },
            { name: 'Sintra Village Stroll', type: 'Low Key', isMustDo: false, description: 'Grab an outdoor table in the village, order traditional Queijadas.' }
        ], lat: 38.7930, lng: -9.4206 },
        { time: "7:00 PM", type: 'dining', icon: 'glass-water', title: "Farewell Lisbon Dinner", description: "Bairro do Avillez (The Páteo). An upscale grand finale to the Lisbon leg of your trip.", lat: 38.7093, lng: -9.1420 }
    ]},
    { date: "March 31, 2026", dayOfWeek: "Tuesday", title: "The Journey South", location: "Lisbon to Algarve", events: [
        { time: "10:00 AM", type: 'travel', icon: 'car', title: "Pick up Rental Car", description: "Pick up your rental car in Lisbon. This one-way rental avoids train transfers.", lat: 38.7742, lng: -9.1342, tags: ['Logistics'],
          tips: [
              { icon: 'shield', text: 'Crucial Check: Before leaving the lot, double-check the installation of the booster seat (Aarit) and the forward-facing 5-point harness seat (Keev).' }
          ]
        },
        { time: "11:00 AM", type: 'activity', icon: 'map', title: "Morning Session (The Drive)", activityOptions: [
            { name: 'Direct Drive down the A2', type: 'Must-Do', isMustDo: true, description: 'Power through the 2.5 hour drive down the A2 highway while the kids (hopefully) take a morning nap.' },
            { name: 'Service Station Pitstop', type: 'Low Key', isMustDo: false, description: 'Stop at an "Área de Serviço". Portuguese highway service stations are surprisingly clean, have decent hot food, and often have small play areas to let kids stretch their legs.' }
        ] },
        { time: "2:00 PM", type: 'rest', icon: 'key-round', title: "Check-in at VILA VITA Parc", description: "Arrive in the Algarve and settle into your Family Suite (Oasis).", lat: 37.1017, lng: -8.3813, tags: ['Lodging'],
          tips: [
              { icon: 'info', text: 'Resort Perk: Inquire immediately about the schedule for Annabella’s Kids Park (for Aarit) and Natalie’s Crèche (for Keev).' }
          ]
        },
        { time: "4:00 PM", type: 'activity', icon: 'sun', title: "Afternoon Session: Resort Life", activityOptions: [
            { name: 'Resort Beach & Pools', type: 'Must-Do', isMustDo: true, description: 'Hit the heated pools or walk down to the resort’s sheltered cove beach for your first taste of the Algarve sand.' },
            { name: 'Resort Exploration', type: 'Low Key', isMustDo: false, description: 'Take a relaxed walk around the massive resort grounds to get your bearings.' }
        ] },
        { time: "6:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Dinner: Vila Vita Biergarten", description: "Bavarian food, casual and lively, located right on the resort grounds. No driving required tonight.", lat: 37.1126, lng: -8.3842 }
    ]},
    { date: "April 1, 2026", dayOfWeek: "Wednesday", title: "Sea Caves & Artisan Hands", location: "Algarve", events: [
        { time: "9:30 AM", type: 'activity', icon: 'ship', title: "Morning Session: Cave Exploration", activityOptions: [
            { name: 'Benagil Cave Boat Tour', type: 'Must-Do', isMustDo: true, description: 'See the famous sea caves from the water.' },
            { name: 'Praia de Carvoeiro Beach Play', type: 'Low Key', isMustDo: false, description: 'If the sea is too rough for boats, go to Carvoeiro beach. It has zero steep staircases to navigate, perfect for easy sandcastle building.' }
        ], lat: 37.0872, lng: -8.4258, tags: ['Adventure'],
          tips: [
              { icon: 'life-buoy', text: 'Boat Safety: Book specifically with CarvoeiroCaves or a similar highly-rated operator. Explicitly request a stable Catamaran (not a speedboat) and confirm they have toddler-sized life jackets for a 3-year-old.' }
          ]
        },
        { time: "12:30 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch in Carvoeiro", description: "Grab a casual lunch at one of the cafes overlooking the beach.", lat: 37.0963, lng: -8.4715 },
        { time: "2:30 PM", type: 'activity', icon: 'brush', title: "Afternoon Session: Tactile Crafts", activityOptions: [
            { name: 'Porches Pottery Workshop', type: 'Must-Do', isMustDo: true, description: 'A wonderful, tactile activity to escape the afternoon sun. Watch the artisans hand-paint traditional tiles, and let Aarit and Keev paint their own ceramics to take home.' },
            { name: 'Carvoeiro Boardwalk', type: 'Low Key', isMustDo: false, description: 'A flat, safe, and stunning wooden boardwalk built over the cliffs. Extremely stroller friendly and highly scenic.' }
        ], lat: 37.1265, lng: -8.3995 },
        { time: "7:00 PM", type: 'dining', icon: 'utensils', title: "Dinner: Adega", description: "Rustic, traditional Portuguese food located conveniently on-site at Vila Vita.", lat: 37.1017, lng: -8.3813 }
    ]},
    { date: "April 2, 2026", dayOfWeek: "Thursday", title: "Anniversary Celebration & Lagos", location: "Algarve", events: [
        { time: "10:00 AM", type: 'activity', icon: 'anchor', title: "Morning Session: Lagos", activityOptions: [
            { name: 'Lagos Grotto Boat Tour', type: 'Must-Do', isMustDo: true, description: 'Drive to Lagos. Take a short 30-45 minute small grotto boat tour right from the marina to go inside the rock arches (Ponta da Piedade).' },
            { name: 'Meia Praia (Lagos Beach)', type: 'Low Key', isMustDo: false, description: 'One of the longest, widest, and flattest beaches in the Algarve. Uncrowded and perfect for toddlers to run wild.' }
        ], lat: 37.1085, lng: -8.6734 },
        { time: "1:00 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: A Forja (Lagos)", description: "Keep it local and avoid unnecessary driving! Stop at this highly-rated, family-friendly spot right in Lagos for authentic Portuguese food.", lat: 37.1025, lng: -8.6740 },
        { time: "3:00 PM", type: 'activity', icon: 'bird', title: "Afternoon Session: Animals & Rest", activityOptions: [
            { name: 'Lagos Zoo', type: 'Must-Do', isMustDo: true, description: 'A highly walkable, boutique zoo specifically tailored for young kids, featuring a great petting farm area and monkey islands.' },
            { name: 'Resort Nap & Prep', type: 'Low Key', isMustDo: false, description: 'Head back to Vila Vita early. Get the kids a solid nap so everyone is in a great mood for the anniversary dinner tonight.' }
        ], lat: 37.1511, lng: -8.7663 },
        { time: "7:00 PM", type: 'dining', icon: 'glass-water', title: "Happy 10th Anniversary! (Praia Dourada)", description: "Celebrate 10 years! It’s a chic, upscale restaurant located directly on the resort's beach.", lat: 37.1017, lng: -8.3813, tags: ['Special Event', 'Kid-Friendly'],
          tips: [
              { icon: 'star', text: 'The Setup: Request a table right on the sand edge. You and Nehal can enjoy fantastic food, cocktails, and sunset views while Aarit and Keev play safely in the sand right next to your table.' }
          ]
        }
    ]},
    { date: "April 3, 2026", dayOfWeek: "Friday", title: "Flamingos & Giant Sculptures", location: "Algarve", events: [
        { time: "10:00 AM", type: 'activity', icon: 'bird', title: "Morning Session: Nature Walk", activityOptions: [
            { name: 'Ludo Trail (Ria Formosa)', type: 'Must-Do', isMustDo: true, description: 'A completely flat, easy stroller walk through the coastal wetlands. The boys can spot wild flamingos and fiddler crabs.' },
            { name: 'Parque das Figuras (Faro)', type: 'Low Key', isMustDo: false, description: 'A large urban park near Faro with wide open spaces and a great playground.' }
        ], lat: 37.0211, lng: -7.9866, tags: ['Outdoors', 'Stroller Friendly'] },
        { time: "1:00 PM", type: 'dining', icon: 'utensils-crossed', title: "Lunch: Austa (Almancil)", description: "A high-end, modern farm-to-table culinary experience.", lat: 37.0850, lng: -8.0280,
          tips: [
              { icon: 'info', text: 'Timing Note: Children under 7 are only permitted here during the day, making this the perfect lunch reservation.' }
          ]
        },
        { time: "3:30 PM", type: 'activity', icon: 'mountain', title: "Afternoon Session: Visual Wonders", activityOptions: [
            { name: 'Sand City (Fiesa)', type: 'Must-Do', isMustDo: true, description: 'The world’s largest sand sculpture park. It is visually mind-blowing for a 5-year-old to see 40-foot tall castles and characters carved out of sand.' },
            { name: 'Mirador Champagne Bar (Sunset)', type: 'Low Key', isMustDo: false, description: 'Located at Pine Cliffs Resort. Let the kids play on the sprawling grassy lawns while you take in the cliff views with a drink.' }
        ], lat: 37.1260, lng: -8.3340 },
        { time: "7:30 PM", type: 'dining', icon: 'utensils', title: "Dinner: A Quinta", description: "Known for its excellent menu, rustic setting, and legendary desserts.", lat: 37.0850, lng: -8.0280 }
    ]},
    { date: "April 4, 2026", dayOfWeek: "Saturday", title: "The Smooth Departure", location: "Algarve to NYC", events: [
        { time: "08:30 AM", type: 'travel', icon: 'car', title: "Checkout & Drive to FAO", description: "Enjoy a final resort breakfast, checkout, and drive to Faro Airport (FAO).", lat: 37.0144, lng: -7.9659, tags: ['Logistics'],
          tips: [
              { icon: 'clock', text: 'Confirm your guaranteed 4:00 PM late check-out doesn\'t accidentally apply; you need to leave in the morning!' },
              { icon: 'car', text: 'Drop off the rental car and ensure you get a receipt confirming the return of both car seats.' }
          ]
        },
        { time: "11:15 AM", type: 'travel', icon: 'plane-takeoff', title: "Flight TP1902 to Lisbon", description: "Short 45-minute hopper flight up to LIS.", lat: 38.7742, lng: -9.1342 },
        { time: "1:00 PM", type: 'activity', icon: 'coffee', title: "Lisbon Layover Options", activityOptions: [
            { name: 'TAP Premium Lounge', type: 'Must-Do', isMustDo: true, description: 'Book lounge access in advance. Get comfortable seating, free food, and a quiz space away from terminal chaos. Essential for keeping stress low before a transatlantic flight.' },
            { name: 'Airport Play Area', type: 'Low Key', isMustDo: false, description: 'Utilize the Lisbon airport children’s play areas to let the boys burn out their energy.' }
        ],
          tips: [
              { icon: 'alert-triangle', text: 'Strict Rule: Do not attempt to leave the airport, store luggage, and take a taxi into the city for a 6-hour layover. The stress of managing two toddlers through security twice is not worth it.' }
          ]
        },
        { time: "5:55 PM", type: 'travel', icon: 'plane', title: "Flight TP203 to Newark", description: "Board your flight home. Safe travels!" }
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
        { icon: 'baby', title: 'Kid-Friendly Culture', text: 'Portugal is exceptionally welcoming to children. It is completely normal for kids to be in restaurants later in the evening. Locals will often go out of their way to accommodate Aarit and Keev.' },
        { icon: 'shield-check', title: 'The "Under 5" Law', text: 'By law in Portugal, pregnant women, the elderly, and families traveling with children under the age of 5 have priority access. Look for the priority lane at museums, castles, and even airport security. You get to skip the line!' },
        { icon: 'footprints', title: 'Navigating Cobblestones', text: 'Lisbon is famously hilly and paved with calçada (cobblestones). A sturdy, lightweight travel stroller is crucial, but a baby carrier is highly recommended for exploring castles, Chiado, and Sintra.' },
        { icon: 'salad', title: 'Food & Dining', text: 'Portuguese cuisine relies heavily on fresh, high-quality ingredients (olive oil, fresh fish, simple meats). You will easily find healthy options without artificial additives for the kids. "Sopa de legumes" (vegetable soup) is on almost every menu and is a healthy, kid-approved staple.' },
        { icon: 'car', title: 'Car Seats', text: 'By law, children under 12 or under 135cm must use an appropriate child seat. Ensure all transfers and rental cars are booked explicitly with a toddler seat for Keev and a booster for Aarit.' }
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
                        <div class="flex items-start bg-yellow-50/80 p-3 rounded-xl border border-yellow-200/60">
                            <div class="bg-yellow-100 p-1.5 rounded-lg mr-3 flex-shrink-0 mt-0.5">
                                <i data-lucide="${tip.icon}" class="w-4 h-4 text-yellow-700"></i>
                            </div>
                            <span class="text-sm text-yellow-900 font-medium leading-relaxed">${tip.text}</span>
                        </div>
                        `).join('') + 
                    `</div>`;
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
                            
                            ${event.activityOptions ? `
                                <div class="mt-4 grid gap-3 text-left">
                                    ${event.activityOptions.map(a => `
                                        <div class="p-4 rounded-xl ${a.isMustDo ? 'bg-teal-50/50 border-teal-200' : 'bg-slate-50 border-slate-200'} border">
                                            <div class="flex justify-between items-start mb-2">
                                                <span class="font-bold ${a.isMustDo ? 'text-teal-900' : 'text-slate-800'} text-sm flex items-center">
                                                    ${a.isMustDo ? '<i data-lucide="star" class="w-4 h-4 mr-2 text-teal-600 fill-teal-600"></i>' : '<i data-lucide="leaf" class="w-4 h-4 mr-2 text-slate-400"></i>'}
                                                    ${a.name}
                                                </span>
                                                <span class="text-[10px] ${a.isMustDo ? 'text-teal-700 bg-teal-100/50 border-teal-200' : 'text-slate-500 bg-white border-slate-200'} font-bold uppercase tracking-wider px-2 py-1 rounded border">${a.type}</span>
                                            </div>
                                            <p class="text-sm ${a.isMustDo ? 'text-teal-800/90' : 'text-slate-600'} leading-relaxed">${a.description}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${event.diningOptions ? `
                                <div class="mt-4 grid gap-3 text-left">
                                    ${event.diningOptions.map(d => `
                                        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <div class="flex justify-between items-start mb-1.5">
                                                <span class="font-bold text-slate-800 text-sm">${d.name}</span>
                                                <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">${d.vibe}</span>
                                            </div>
                                            <p class="text-sm text-slate-600 leading-relaxed">${d.notes}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
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
                            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pick-up</span>
                            <strong class="text-sm text-slate-800 block">${reservationData.transport.pickup}</strong>
                        </div>
                        <div class="bg-white p-3 rounded-xl border border-slate-100">
                            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Drop-off</span>
                            <strong class="text-sm text-slate-800 block">${reservationData.transport.dropoff}</strong>
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
                            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Meeting Details</span>
                            <strong class="text-sm text-slate-800 block">${reservationData.sintraDayTrip.schedule}</strong>
                            <span class="text-xs text-slate-500 mt-1 block">${reservationData.sintraDayTrip.pickup}</span>
                        </div>
                    </div>
                    <div class="p-3.5 bg-white rounded-xl border border-slate-200 text-sm flex items-start">
                        <i data-lucide="map" class="w-5 h-5 text-teal-600 mr-2 flex-shrink-0 mt-0.5"></i>
                        <div>
                            <span class="font-bold text-slate-800 block mb-0.5">Route:</span> 
                            <span class="text-slate-600 leading-relaxed text-xs">${reservationData.sintraDayTrip.route}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const bookingLinksHtml = `
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
            <h2 class="text-2xl font-outfit font-bold text-slate-800 mb-6 flex items-center"><i data-lucide="bookmark" class="w-6 h-6 mr-3 text-teal-600"></i>Activity & Restaurant Directory</h2>
            
            <h4 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Dining Reservations</h4>
            <div class="space-y-3 mb-8">
                ${reservationData.bookingLinks.map(link => `
                    <div class="flex flex-col md:flex-row justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-teal-300 transition-colors">
                        <div class="mb-3 md:mb-0">
                            <span class="text-xs font-bold text-teal-600 uppercase tracking-wider">${link.day}</span>
                            <strong class="block text-slate-800 text-lg mt-0.5">${link.name}</strong>
                            ${link.note ? `<span class="block text-xs text-red-700 mt-2 bg-red-50 px-2 py-1 rounded inline-block border border-red-100">${link.note}</span>` : ''}
                        </div>
                        <div class="md:text-right md:max-w-[250px] flex flex-col justify-center">
                            <span class="block text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Booking Method</span>
                            <span class="block text-sm text-slate-700 font-medium">${link.method}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <h4 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Activity & Tour Log</h4>
            <div class="grid md:grid-cols-2 gap-4">
                ${reservationData.activities.map(act => `
                    <div class="p-4 border border-slate-200 bg-slate-50 rounded-xl">
                        <strong class="block text-slate-800 mb-1">${act.name}</strong>
                        <span class="text-sm text-slate-600">${act.details}</span>
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
            ${bookingLinksHtml}
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
