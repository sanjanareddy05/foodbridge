// ─── Constants ───────────────────────────────────────────────────────────────
export const FOOD_TYPES = [
  'Cooked Meals', 'Bakery', 'Raw Produce',
  'Dairy', 'Catering / Event', 'Packaged Food',
]

export const STORAGE_CONDITIONS = [
  'Room Temperature', 'Refrigerated', 'Hot / Heated', 'Frozen',
]

export const FOOD_EMOJIS = {
  'Cooked Meals':    '🍛',
  'Bakery':          '🍞',
  'Raw Produce':     '🥦',
  'Dairy':           '🥛',
  'Catering / Event':'🎊',
  'Packaged Food':   '📦',
}

export const initialListings = [
  { id:'L001', name:'Chicken Biryani', type:'Cooked Meals', source:'Spice Route Restaurant', sourceId:'R01', quantity:80, unit:'kg', distance:1.2, preparedAt:'10:30', pickupDeadline:'15:00', storage:'Hot / Heated', allergens:'Nuts, Dairy', notes:'Freshly cooked for lunch service — extra portions from buffet', status:'available', spoilageRisk:87, location:{lat:23.2599,lng:77.4126}, createdAt:new Date(Date.now()-12*60000).toISOString(), emoji:'🍛' },
  { id:'L002', name:'Assorted Bread Loaves', type:'Bakery', source:'Sunrise Bakery', sourceId:'R02', quantity:45, unit:'kg', distance:0.9, preparedAt:'06:00', pickupDeadline:'20:00', storage:'Room Temperature', allergens:'Gluten', notes:'Mixed white and brown loaves, baguettes, dinner rolls', status:'available', spoilageRisk:22, location:{lat:23.2555,lng:77.4050}, createdAt:new Date(Date.now()-45*60000).toISOString(), emoji:'🍞' },
  { id:'L003', name:'Wedding Catering — Dal, Paneer, Rice', type:'Catering / Event', source:'Raj Banquet Hall', sourceId:'R03', quantity:200, unit:'kg', distance:4.1, preparedAt:'11:00', pickupDeadline:'18:00', storage:'Room Temperature', allergens:'Dairy', notes:'Multiple dishes from a wedding function — needs 2+ volunteers', status:'available', spoilageRisk:48, location:{lat:23.2720,lng:77.4320}, createdAt:new Date(Date.now()-90*60000).toISOString(), emoji:'🎊' },
  { id:'L004', name:'Mixed Veg Curry + Steamed Rice', type:'Cooked Meals', source:'Grand Palace Hotel', sourceId:'R04', quantity:120, unit:'kg', distance:2.8, preparedAt:'12:00', pickupDeadline:'17:00', storage:'Hot / Heated', allergens:'None', notes:'From hotel buffet — single pickup preferred, containers provided', status:'in-transit', spoilageRisk:61, assignedVolunteer:'Priya Sharma', assignedVolunteerId:'V01', assignedNgo:'N01', acceptedAt:new Date(Date.now()-30*60000).toISOString(), location:{lat:23.2500,lng:77.4200}, createdAt:new Date(Date.now()-120*60000).toISOString(), emoji:'🍲' },
  { id:'L005', name:'Greek Yogurt & Cottage Cheese', type:'Dairy', source:'FreshMart Grocery', sourceId:'R05', quantity:30, unit:'kg', distance:3.3, preparedAt:'09:00', pickupDeadline:'14:00', storage:'Refrigerated', allergens:'Dairy', notes:'Approaching best-before — refrigerated transport required', status:'delivered', spoilageRisk:73, assignedVolunteer:'Ravi Kumar', assignedVolunteerId:'V02', assignedNgo:'N01', qrVerified:true, qrCode:'FB-L005-K7X2MN', acceptedAt:new Date(Date.now()-150*60000).toISOString(), deliveredAt:new Date(Date.now()-60*60000).toISOString(), location:{lat:23.2650,lng:77.4010}, createdAt:new Date(Date.now()-180*60000).toISOString(), emoji:'🥛' },
  { id:'L006', name:'Seasonal Fruit Basket', type:'Raw Produce', source:'City Farmers Market', sourceId:'R06', quantity:60, unit:'kg', distance:5.5, preparedAt:'07:00', pickupDeadline:'16:00', storage:'Room Temperature', allergens:'None', notes:'Mangoes, bananas, papayas — end of day surplus, very fresh', status:'available', spoilageRisk:35, location:{lat:23.2480,lng:77.4380}, createdAt:new Date(Date.now()-200*60000).toISOString(), emoji:'🍎' },
  { id:'L007', name:'Corporate Lunch Leftovers', type:'Cooked Meals', source:'TechPark Cafeteria', sourceId:'R07', quantity:55, unit:'kg', distance:2.1, preparedAt:'13:00', pickupDeadline:'16:30', storage:'Room Temperature', allergens:'Gluten, Dairy', notes:'Sandwiches, pasta, salads from corporate lunch — sealed containers', status:'available', spoilageRisk:55, location:{lat:23.2610,lng:77.4250}, createdAt:new Date(Date.now()-25*60000).toISOString(), emoji:'🥗' },
]

export const initialNGOs = [
  { id:'N01', name:'Hope Community Shelter', director:'Sister Meena', capacity:250, address:'Arera Colony, Bhopal', phone:'+91-755-2670001', email:'contact@hopeshelter.org', verified:true, mealsReceived:3240 },
  { id:'N02', name:'City Food Bank', director:'Mr. Joshi', capacity:500, address:'New Market, Bhopal', phone:'+91-755-2670002', email:'info@cityfoodbank.org', verified:true, mealsReceived:5180 },
  { id:'N03', name:'Annadaan Foundation', director:'Dr. Patel', capacity:150, address:'Kolar Road, Bhopal', phone:'+91-755-2670003', email:'hello@annadaan.org', verified:true, mealsReceived:1842 },
]

export const initialVolunteers = [
  { id:'V01', name:'Priya Sharma', phone:'+91-9876543210', vehicle:'Scooter', rating:4.9, deliveries:47, kgDelivered:1240, status:'active', avatar:'PS', joinedAt:'2024-08-15' },
  { id:'V02', name:'Ravi Kumar', phone:'+91-9876543211', vehicle:'Bicycle', rating:4.7, deliveries:31, kgDelivered:680, status:'active', avatar:'RK', joinedAt:'2024-09-20' },
  { id:'V03', name:'Amit Singh', phone:'+91-9876543212', vehicle:'Car', rating:5.0, deliveries:82, kgDelivered:3410, status:'busy', avatar:'AS', joinedAt:'2024-06-01' },
  { id:'V04', name:'Divya Nair', phone:'+91-9876543213', vehicle:'Scooter', rating:4.8, deliveries:24, kgDelivered:590, status:'active', avatar:'DN', joinedAt:'2024-11-10' },
]

export const initialNotifications = [
  { id:'NT1', type:'urgent', title:'Urgent: Biryani expiring at 3 PM', desc:'Spice Route Restaurant · 80 kg · 1.2 km away · AI risk 87%', time:'12 min ago', read:false, listingId:'L001' },
  { id:'NT2', type:'tracking', title:'Volunteer Priya is 500 m from pickup', desc:'ETA 4 minutes · Veg Curry at Grand Palace Hotel', time:'3 min ago', read:false, listingId:'L004' },
  { id:'NT3', type:'success', title:'Delivery confirmed — 30 kg dairy received', desc:'FreshMart → Hope Shelter · QR #FB-L005-K7X2MN verified', time:'1 hr ago', read:true, listingId:'L005' },
  { id:'NT4', type:'info', title:'New listing: 60 kg fruits at Farmers Market', desc:'5.5 km away · Pickup by 4:00 PM · Low spoilage risk', time:'3 hr ago', read:true, listingId:'L006' },
]

export const impactData = {
  mealsToday:342, mealsMTD:8420, kgRescuedMTD:1247, co2PreventedMTD:2100,
  beneficiariesMTD:1240, volunteersActive:4, partnersTotal:34, avgDeliveryMin:22,
  weeklyTrend:[
    {day:'Mon',kg:180,meals:540},{day:'Tue',kg:220,meals:660},{day:'Wed',kg:165,meals:495},
    {day:'Thu',kg:290,meals:870},{day:'Fri',kg:310,meals:930},{day:'Sat',kg:195,meals:585},{day:'Sun',kg:142,meals:426},
  ],
  byCategory:[
    {label:'Cooked Meals',pct:48,color:'#16a34a'},{label:'Catering / Event',pct:28,color:'#2563eb'},
    {label:'Bakery',pct:14,color:'#d97706'},{label:'Raw Produce',pct:10,color:'#7c3aed'},
  ],
  monthlyTrend:[
    {month:'Feb',kg:820},{month:'Mar',kg:940},{month:'Apr',kg:870},
    {month:'May',kg:1050},{month:'Jun',kg:1130},{month:'Jul',kg:1247},
  ],
}
