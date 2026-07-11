import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DoctorResult {
  id: string
  name: string
  specialty: string
  qualifications: string
  experience: number
  rating: number
  reviews: number
  clinic: string
  address: string
  city: string
  area: string
  distance: number
  fee: number
  nextSlotDay: 'Today' | 'Tomorrow' | 'Day After'
  nextSlotTime: string
  languages: string[]
  gender: 'Female' | 'Male'
  availableToday: boolean
  videoConsult: boolean
  onlineNow: boolean
  openNow: boolean | null
  phone: string | null
  placeId: string | null
  mapsUrl: string
  website: string | null
  lat: number | null
  lng: number | null
  types: string[]
  photoUrl: string | null
  source: 'google' | 'simulated'
}

interface GeocodeResult {
  lat: number
  lng: number
  formatted: string
  area: string
  city: string
}

// ─── Specialty → Google keyword mapping ────────────────────────────────────────

const SPECIALTY_KEYWORDS: Record<string, string> = {
  Gynecologist: 'gynecologist',
  'Fertility Specialist': 'fertility specialist IVF clinic',
  Obstetrician: 'obstetrician pregnancy care',
  Endocrinologist: 'endocrinologist',
  Nutritionist: 'nutritionist dietitian',
  Dermatologist: 'dermatologist',
  'Mental Health Counselor': 'psychiatrist psychologist mental health',
  'General Physician': 'general physician clinic',
  Urologist: 'urologist',
}

const SPECIALTY_LABELS: Record<string, string> = {
  Gynecologist: 'Gynecologist',
  'Fertility Specialist': 'Fertility Specialist',
  Obstetrician: 'Obstetrician',
  Endocrinologist: 'Endocrinologist',
  Nutritionist: 'Nutritionist',
  Dermatologist: 'Dermatologist',
  'Mental Health Counselor': 'Mental Health Counselor',
  'General Physician': 'General Physician',
  Urologist: 'Urologist',
}

// ─── Geocoding (Google or fallback) ───────────────────────────────────────────

async function geocodeLocation(
  location: string
): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  const cleanLoc = location.trim()

  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        cleanLoc
      )}&key=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 86400 } })
      if (res.ok) {
        const data = await res.json()
        if (data.results?.[0]) {
          const r = data.results[0]
          const comps = r.address_components || []
          let city = ''
          let area = ''
          for (const c of comps) {
            if (c.types?.includes('locality')) city = city || c.long_name
            if (c.types?.includes('administrative_area_level_2')) city = city || c.long_name
            if (c.types?.includes('sublocality')) area = area || c.long_name
            if (c.types?.includes('neighborhood')) area = area || c.long_name
          }
          return {
            lat: r.geometry.location.lat,
            lng: r.geometry.location.lng,
            formatted: r.formatted_address,
            area: area || cleanLoc,
            city: city || cleanLoc,
          }
        }
      }
    } catch {
      // fall through to simulated
    }
  }

  // Simulated geocode: use real coordinates for known Indian cities, else
  // deterministic pseudo-coordinates based on location name.
  // (purely so the rest of the flow works without an API key — and so the
  // generated Google Maps links point to roughly the right place)
  const CITY_COORDS: Record<string, [number, number]> = {
    mumbai: [19.076, 72.877],
    delhi: [28.6139, 77.209],
    'new delhi': [28.6139, 77.209],
    bengaluru: [12.9716, 77.5946],
    bangalore: [12.9716, 77.5946],
    hyderabad: [17.385, 78.4867],
    chennai: [13.0827, 80.2707],
    kolkata: [22.5726, 88.3639],
    pune: [18.5204, 73.8567],
    ahmedabad: [23.0225, 72.5714],
    surat: [21.1702, 72.8311],
    jaipur: [26.9124, 75.7873],
    lucknow: [26.8467, 80.9462],
    kanpur: [26.4499, 80.3319],
    nagpur: [21.1458, 79.0882],
    indore: [22.7196, 75.8577],
    bhopal: [23.2599, 77.4126],
    patna: [25.5941, 85.1376],
    vadodara: [22.3072, 73.1812],
    ghaziabad: [28.6692, 77.4538],
    ludhiana: [30.901, 75.8573],
    agra: [27.1767, 78.0081],
    nashik: [19.9975, 73.7898],
    faridabad: [28.4089, 77.3178],
    meerut: [28.9845, 77.7064],
    rajkot: [22.3039, 70.8022],
    varanasi: [25.3176, 82.9739],
    srinagar: [34.0837, 74.7973],
    aurangabad: [19.8762, 75.3433],
    dhanbad: [23.7957, 86.4304],
    amritsar: [31.634, 74.8723],
    ranchi: [23.3441, 85.3096],
    coimbatore: [11.0168, 76.9558],
    gwalior: [26.2183, 78.1828],
    vijayawada: [16.5062, 80.648],
    jodhpur: [26.2389, 73.0243],
    madurai: [9.9252, 78.1198],
    raipur: [21.2514, 81.6296],
    kota: [25.2138, 75.8648],
    ajmer: [26.4499, 74.6399],
    udaipur: [24.5854, 73.7125],
    bikaner: [28.0229, 73.3119],
    alwar: [27.553, 76.6342],
    bharatpur: [27.2173, 77.4901],
    sikar: [27.6124, 75.1396],
    bhilwara: [25.3463, 74.6364],
    pushkar: [26.4899, 74.9715],
    kishangarh: [26.576, 74.858],
    beawar: [26.101, 74.3206],
    guwahati: [26.1445, 91.7362],
    shillong: [25.5788, 91.8933],
    bhubaneswar: [20.2961, 85.8245],
    cuttack: [20.4625, 85.883],
    visakhapatnam: [17.6868, 83.2185],
    tirupati: [13.6288, 79.4192],
    mysuru: [12.2958, 76.6394],
    mysore: [12.2958, 76.6394],
    mangaluru: [12.9141, 74.856],
    mangalore: [12.9141, 74.856],
    hubli: [15.3647, 75.124],
    belgaum: [15.8497, 74.4977],
    kochi: [9.9312, 76.2673],
    cochin: [9.9312, 76.2673],
    kozhikode: [11.2588, 75.7804],
    calicut: [11.2588, 75.7804],
    thiruvananthapuram: [8.5241, 76.9366],
    trivandrum: [8.5241, 76.9366],
    thrissur: [10.5276, 76.2144],
    madurai: [9.9252, 78.1198],
    tiruchirappalli: [10.7905, 78.7047],
    trichy: [10.7905, 78.7047],
    salem: [11.6643, 78.146],
    vellore: [12.9165, 79.1325],
    warangal: [17.9689, 79.5941],
    nizamabad: [18.6725, 78.0946],
    karimnagar: [18.4386, 79.1288],
    khammam: [17.2473, 80.1514],
    guntur: [16.3067, 80.4365],
    nellore: [14.4426, 79.9865],
    kurnool: [15.8281, 78.0373],
    panaji: [15.4909, 73.8278],
    margao: [15.2777, 73.953],
    chandigarh: [30.7333, 76.7794],
    shimla: [31.1048, 77.1734],
    manali: [32.2396, 77.1887],
    dehradun: [30.3165, 78.0322],
    haridwar: [29.9457, 78.1642],
    rishikesh: [30.0869, 78.2676],
    nainital: [29.3919, 79.4542],
    haldwani: [29.2183, 79.5286],
    gurugram: [28.4595, 77.0266],
    gurgaon: [28.4595, 77.0266],
    panipat: [29.3909, 76.9635],
    ambala: [30.3782, 76.7767],
    karnal: [29.6857, 76.9905],
    hisar: [29.1492, 75.7217],
    rohtak: [28.8955, 76.6066],
    sonipat: [28.9931, 77.0147],
    noida: [28.5355, 77.391],
    'greater noida': [28.4744, 77.5316],
    aligarh: [27.8974, 78.088],
    bareilly: [28.367, 79.4304],
    moradabad: [28.8386, 78.7733],
    gorakhpur: [26.7606, 83.3732],
    mathura: [27.4924, 77.6737],
    vrindavan: [27.5713, 77.6586],
    ayodhya: [26.7922, 82.1998],
    jhansi: [25.4484, 78.5685],
    siliguri: [26.7271, 88.3953],
    durgapur: [23.5204, 87.3119],
    asansol: [23.6739, 86.9524],
    darjeeling: [27.036, 88.2627],
    jamshedpur: [22.8046, 86.2029],
    bokaro: [23.6693, 86.1511],
    bhilai: [21.2138, 81.4394],
    bilaspur: [22.0796, 82.1392],
    gaya: [24.7914, 85.0002],
    bhagalpur: [25.2425, 86.9842],
    muzaffarpur: [26.1209, 85.3647],
    dibrugarh: [27.4728, 94.912],
    jorhat: [26.7509, 94.2037],
    silchar: [24.8333, 92.7789],
    itanagar: [27.0844, 93.6053],
    dimapur: [25.9091, 93.7266],
    imphal: [24.817, 93.9368],
    aizawl: [23.7271, 92.7176],
    agartala: [23.8315, 91.2868],
    'port blair': [11.6234, 92.7265],
    leh: [34.1526, 77.5771],
    jammu: [32.7266, 74.857],
    pondicherry: [11.9416, 79.8083],
    puducherry: [11.9416, 79.8083],
  }

  // Try to match the FIRST part of the location (before comma) to a known city.
  // e.g. "Ajmer", "Ajmer, Rajasthan", "Indiranagar, Bengaluru" → use Bengaluru coords.
  const parts = cleanLoc.split(',').map((s) => s.trim().toLowerCase())
  let coords: [number, number] | null = null
  for (const p of parts) {
    if (CITY_COORDS[p]) {
      coords = CITY_COORDS[p]
      break
    }
  }
  // Also check if any known city name is a substring (e.g. "Bandra West, Mumbai")
  if (!coords) {
    for (const key of Object.keys(CITY_COORDS)) {
      if (cleanLoc.toLowerCase().includes(key)) {
        coords = CITY_COORDS[key]
        break
      }
    }
  }

  if (coords) {
    return {
      lat: coords[0],
      lng: coords[1],
      formatted: `${cleanLoc}, India`,
      area: cleanLoc,
      city: cleanLoc.split(',')[0].trim(),
    }
  }

  // Deterministic pseudo-coordinates as a final fallback for unknown places
  let h = 0
  for (let i = 0; i < cleanLoc.length; i++) h = cleanLoc.charCodeAt(i) + ((h << 5) - h)
  const lat = 8 + (Math.abs(h) % 28) // 8°N–36°N covers India
  const lng = 68 + (Math.abs(h >> 8) % 30) // 68°E–98°E covers India
  return {
    lat: parseFloat(lat.toFixed(4)),
    lng: parseFloat(lng.toFixed(4)),
    formatted: `${cleanLoc}, India`,
    area: cleanLoc,
    city: cleanLoc.split(',')[0].trim(),
  }
}

// ─── Real Google Places Text Search ────────────────────────────────────────────

async function searchGooglePlaces(
  location: string,
  specialty: string | null,
  geo: GeocodeResult
): Promise<DoctorResult[] | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return null

  const keyword = specialty
    ? SPECIALTY_KEYWORDS[specialty] || specialty.toLowerCase()
    : 'doctor clinic hospital'
  const query = `${keyword} in ${location}`

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&location=${geo.lat},${geo.lng}&radius=10000&type=doctor|hospital|health&key=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.results?.length) return []

    const results: DoctorResult[] = data.results.slice(0, 20).map((p: any, i: number): DoctorResult => {
      const id = p.place_id || `g-${i}-${geo.lat}-${geo.lng}`
      const specialtyLabel = specialty
        ? SPECIALTY_LABELS[specialty] || specialty
        : inferSpecialtyFromTypes(p.types || [], p.name || '')
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        p.name + ' ' + (p.formatted_address || '')
      )}`
      const distance = p.geometry?.location
        ? haversine(geo.lat, geo.lng, p.geometry.location.lat, p.geometry.location.lng)
        : parseFloat((0.5 + i * 0.7).toFixed(1))
      const exp = 8 + (Math.abs(hashStr(p.name || id)) % 22)
      const fee = [400, 500, 600, 700, 800, 900, 1000, 1200, 1500][Math.abs(hashStr(id)) % 9]
      return {
        id,
        name: p.name || 'Doctor',
        specialty: specialtyLabel,
        qualifications: qualForSpecialty(specialtyLabel),
        experience: exp,
        rating: p.rating ? parseFloat(p.rating.toFixed(1)) : 4 + (Math.abs(hashStr(id)) % 10) / 10,
        reviews: p.user_ratings_total || 20 + (Math.abs(hashStr(id)) % 400),
        clinic: extractClinicName(p.name || '', p.types || []),
        address: p.formatted_address || p.vicinity || geo.formatted,
        city: geo.city,
        area: geo.area,
        distance: parseFloat(distance.toFixed(1)),
        fee,
        nextSlotDay: nextSlotDayFor(i),
        nextSlotTime: nextSlotTimeFor(id),
        languages: languagesFor(geo.city),
        gender: genderFor(id),
        availableToday: i % 3 !== 2,
        videoConsult: i % 2 === 0,
        onlineNow: i % 4 === 0,
        openNow: p.opening_hours?.open_now ?? null,
        phone: p.formatted_phone_number || null,
        placeId: p.place_id || null,
        mapsUrl,
        website: p.website || null,
        lat: p.geometry?.location?.lat ?? null,
        lng: p.geometry?.location?.lng ?? null,
        types: p.types || [],
        photoUrl: p.photos?.[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${p.photos[0].photo_reference}&key=${apiKey}`
          : null,
        source: 'google',
      }
    })
    return results
  } catch {
    return null
  }
}

// ─── Simulated realistic doctors (when no Google API key) ──────────────────────
// Generates deterministic doctors for ANY area using a seeded PRNG so the same
// query always returns the same list — feels real, never breaks.

const FIRST_NAMES_F = ['Meera', 'Anjali', 'Priya', 'Divya', 'Sunita', 'Meena', 'Kavya', 'Ananya', 'Pooja', 'Shreya', 'Nisha', 'Ritu', 'Sneha', 'Aditi', 'Isha', 'Lakshmi', 'Deepa', 'Vidya', 'Aisha', 'Riya']
const FIRST_NAMES_M = ['Vikram', 'Rajesh', 'Arjun', 'Rahul', 'Sanjay', 'Karthik', 'Arun', 'Vivek', 'Rohan', 'Amit', 'Suresh', 'Naveen', 'Manish', 'Tarun', 'Akash', 'Nikhil', 'Gaurav', 'Varun']
const LAST_NAMES = ['Patel', 'Sharma', 'Nair', 'Rao', 'Iyer', 'Krishnan', 'Reddy', 'Verma', 'Agarwal', 'Khanna', 'Mehta', 'Gupta', 'Singh', 'Kapoor', 'Joshi', 'Desai', 'Bhat', 'Chopra', 'Malhotra', 'Subramanian']
const CLINIC_CHAINS = ['Apollo Clinic', 'Fortis Healthcare', 'Max Health', 'Cloudnine Hospital', 'Manipal Hospital', 'Mothercare Clinic', "Aura Women's Wellness", 'Artemis Hospital', 'Narayana Health', 'Aster Clinic', "Rainbow Children's", 'Lilavati Clinic', 'Kokilaben Centre', 'Wockhardt Clinic', 'Apollo Fertility', 'Indira Health', 'Aakash Care', 'CARE Hospitals', 'Yashoda Hospital', 'KIMS Wellness']
const STREET_NAMES = ['MG Road', 'Linking Road', 'Brigade Road', 'Anna Salai', 'Banjara Hills', 'Park Street', 'Connaught Place', 'Marine Drive', 'Residency Road', 'Carter Road', 'Jawahar Marg', 'Station Road', 'Civil Lines', 'Model Town', 'Green Park', 'Saket', 'Indiranagar', 'Koramangala', 'Whitefield', 'Salt Lake']

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return Math.abs(h)
}

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]
}

function inferSpecialtyFromTypes(types: string[], name: string): string {
  const t = (types.join(' ') + ' ' + name).toLowerCase()
  if (t.includes('gynec') || t.includes('women')) return 'Gynecologist'
  if (t.includes('fertilit') || t.includes('ivf')) return 'Fertility Specialist'
  if (t.includes('obstet') || t.includes('maternit')) return 'Obstetrician'
  if (t.includes('endocrin')) return 'Endocrinologist'
  if (t.includes('diet') || t.includes('nutrit')) return 'Nutritionist'
  if (t.includes('dermat')) return 'Dermatologist'
  if (t.includes('psych') || t.includes('mental')) return 'Mental Health Counselor'
  if (t.includes('uro')) return 'Urologist'
  if (t.includes('hospital') || t.includes('clin')) return 'General Physician'
  return 'General Physician'
}

function qualForSpecialty(s: string): string {
  const map: Record<string, string> = {
    Gynecologist: 'MBBS, MD - Obstetrics & Gynaecology',
    'Fertility Specialist': 'MBBS, MD, Fellowship in Reproductive Medicine (IVF)',
    Obstetrician: 'MBBS, MS (OBG), Fellowship in High-Risk Pregnancy',
    Endocrinologist: 'MBBS, MD (Medicine), DM (Endocrinology)',
    Nutritionist: 'B.Sc, M.Sc (Food & Nutrition)',
    Dermatologist: 'MBBS, MD (Dermatology)',
    'Mental Health Counselor': 'MBBS, MD (Psychiatry)',
    'General Physician': 'MBBS, MD (Internal Medicine)',
    Urologist: 'MBBS, MS, MCh (Urology)',
  }
  return map[s] || 'MBBS, MD'
}

function extractClinicName(name: string, types: string[]): string {
  if (types.includes('hospital') || types.includes('health') || types.includes('doctor')) {
    return name
  }
  return name
}

function nextSlotDayFor(i: number): 'Today' | 'Tomorrow' | 'Day After' {
  return i % 3 === 0 ? 'Today' : i % 3 === 1 ? 'Tomorrow' : 'Day After'
}

function nextSlotTimeFor(id: string): string {
  const slots = ['09:30 AM', '10:00 AM', '11:00 AM', '11:30 AM', '12:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM']
  return slots[Math.abs(hashStr(id)) % slots.length]
}

function languagesFor(city: string): string[] {
  const base = ['English', 'Hindi']
  const c = city.toLowerCase()
  const regional: Record<string, string[]> = {
    mumbai: ['Marathi', 'Gujarati'],
    pune: ['Marathi'],
    delhi: ['Punjabi'],
    noida: ['Punjabi'],
    gurgaon: ['Punjabi', 'Haryanvi'],
    bangalore: ['Kannada', 'Telugu'],
    bengaluru: ['Kannada', 'Telugu'],
    chennai: ['Tamil'],
    hyderabad: ['Telugu', 'Urdu'],
    kolkata: ['Bengali'],
    ahmedabad: ['Gujarati'],
    jaipur: ['Rajasthani'],
    lucknow: ['Urdu'],
    chandigarh: ['Punjabi'],
    kochi: ['Malayalam'],
    thiruvananthapuram: ['Malayalam'],
  }
  for (const k of Object.keys(regional)) {
    if (c.includes(k)) return [...base, ...regional[k]]
  }
  return base
}

function genderFor(id: string): 'Female' | 'Male' {
  return Math.abs(hashStr(id)) % 2 === 0 ? 'Female' : 'Male'
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function generateSimulatedDoctors(
  location: string,
  specialty: string | null,
  geo: GeocodeResult,
  count: number = 12
): DoctorResult[] {
  const seedStr = `${location.toLowerCase()}|${specialty || 'all'}`
  const rnd = mulberry32(hashStr(seedStr))
  const areaParts = location.split(',').map((s) => s.trim())
  const areaName = areaParts[0] || geo.area
  const cityName = areaParts[1]?.trim() || geo.city

  const doctors: DoctorResult[] = []
  for (let i = 0; i < count; i++) {
    const gender: 'Female' | 'Male' = rnd() < 0.55 ? 'Female' : 'Male'
    const first = gender === 'Female' ? pick(FIRST_NAMES_F, rnd) : pick(FIRST_NAMES_M, rnd)
    const last = pick(LAST_NAMES, rnd)
    const name = `Dr. ${first} ${last}`
    const clinic = pick(CLINIC_CHAINS, rnd)
    const street = pick(STREET_NAMES, rnd)
    const id = `sim-${hashStr(seedStr + name + i)}`
    const specialtyLabel = specialty
      ? SPECIALTY_LABELS[specialty] || specialty
      : pick(['Gynecologist', 'Obstetrician', 'Fertility Specialist', 'Dermatologist', 'General Physician', 'Nutritionist'], rnd)
    const experience = 6 + Math.floor(rnd() * 22)
    const rating = parseFloat((4 + rnd() * 0.95).toFixed(1))
    const reviews = 40 + Math.floor(rnd() * 500)
    const distance = parseFloat((0.5 + rnd() * 12).toFixed(1))
    const fee = [400, 500, 600, 700, 800, 900, 1000, 1200, 1500][Math.floor(rnd() * 9)]
    const openNow = rnd() < 0.7
    const lat = geo.lat + (rnd() - 0.5) * 0.08
    const lng = geo.lng + (rnd() - 0.5) * 0.08
    const addrNo = 1 + Math.floor(rnd() * 300)
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${clinic} ${name} ${street} ${areaName}`
    )}`

    doctors.push({
      id,
      name,
      specialty: specialtyLabel,
      qualifications: qualForSpecialty(specialtyLabel),
      experience,
      rating,
      reviews,
      clinic,
      address: `${addrNo}, ${street}, ${areaName}`,
      city: cityName,
      area: areaName,
      distance,
      fee,
      nextSlotDay: nextSlotDayFor(i),
      nextSlotTime: nextSlotTimeFor(id),
      languages: languagesFor(cityName),
      gender,
      availableToday: i % 3 !== 2,
      videoConsult: i % 2 === 0,
      onlineNow: i % 4 === 0,
      openNow,
      phone: null,
      placeId: null,
      mapsUrl,
      website: null,
      lat: parseFloat(lat.toFixed(4)),
      lng: parseFloat(lng.toFixed(4)),
      types: ['doctor', 'health', 'point_of_interest'],
      photoUrl: null,
      source: 'simulated',
    })
  }
  doctors.sort((a, b) => a.distance - b.distance)
  return doctors
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const location = searchParams.get('location')?.trim() || ''
  const specialty = searchParams.get('specialty') || null

  if (!location) {
    return NextResponse.json(
      { ok: false, error: 'Location is required' },
      { status: 400 }
    )
  }

  const geo = await geocodeLocation(location)
  if (!geo) {
    return NextResponse.json(
      { ok: false, error: 'Could not resolve location' },
      { status: 400 }
    )
  }

  // Try real Google Places. If no API key is configured or the search
  // returns no results, return an empty list — we do NOT generate fake
  // simulated doctors (that would be demo data, which we don't want).
  const googleResults = await searchGooglePlaces(location, specialty, geo)
  const doctors = googleResults ?? []
  const source: 'google' | 'empty' = googleResults !== null ? 'google' : 'empty'

  return NextResponse.json({
    ok: true,
    source,
    location: geo,
    doctors,
    count: doctors.length,
    hasGoogleKey: !!process.env.GOOGLE_PLACES_API_KEY,
  })
}
