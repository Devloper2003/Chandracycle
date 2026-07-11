import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/doctors/geocode?lat=...&lng=...  → reverse geocode (use my location)
// GET /api/doctors/geocode?q=...            → area autocomplete suggestions

interface AreaSuggestion {
  description: string
  placeId: string | null
  mainText: string
  secondaryText: string
  lat: number | null
  lng: number | null
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return Math.abs(h)
}

// Comprehensive list of Indian cities + well-known areas with states.
// Used as a fallback when no Google API key is configured.
// Covers metros, tier-2, tier-3 cities and many smaller towns so that
// users from ANY part of India get sensible autocomplete suggestions.
const INDIAN_PLACES: { main: string; sec: string }[] = [
  // Metros
  { main: 'Mumbai', sec: 'Maharashtra, India' },
  { main: 'Delhi', sec: 'NCR, India' },
  { main: 'New Delhi', sec: 'Delhi, India' },
  { main: 'Bengaluru', sec: 'Karnataka, India' },
  { main: 'Bangalore', sec: 'Karnataka, India' },
  { main: 'Hyderabad', sec: 'Telangana, India' },
  { main: 'Chennai', sec: 'Tamil Nadu, India' },
  { main: 'Kolkata', sec: 'West Bengal, India' },
  { main: 'Pune', sec: 'Maharashtra, India' },
  { main: 'Ahmedabad', sec: 'Gujarat, India' },
  { main: 'Surat', sec: 'Gujarat, India' },
  { main: 'Jaipur', sec: 'Rajasthan, India' },
  { main: 'Lucknow', sec: 'Uttar Pradesh, India' },
  { main: 'Kanpur', sec: 'Uttar Pradesh, India' },
  { main: 'Nagpur', sec: 'Maharashtra, India' },
  { main: 'Indore', sec: 'Madhya Pradesh, India' },
  { main: 'Bhopal', sec: 'Madhya Pradesh, India' },
  { main: 'Patna', sec: 'Bihar, India' },
  { main: 'Vadodara', sec: 'Gujarat, India' },
  { main: 'Ghaziabad', sec: 'Uttar Pradesh, India' },
  { main: 'Ludhiana', sec: 'Punjab, India' },
  { main: 'Agra', sec: 'Uttar Pradesh, India' },
  { main: 'Nashik', sec: 'Maharashtra, India' },
  { main: 'Faridabad', sec: 'Haryana, India' },
  { main: 'Meerut', sec: 'Uttar Pradesh, India' },
  { main: 'Rajkot', sec: 'Gujarat, India' },
  { main: 'Kalyan', sec: 'Maharashtra, India' },
  { main: 'Vasai', sec: 'Maharashtra, India' },
  { main: 'Varanasi', sec: 'Uttar Pradesh, India' },
  { main: 'Srinagar', sec: 'Jammu & Kashmir, India' },
  { main: 'Aurangabad', sec: 'Maharashtra, India' },
  { main: 'Dhanbad', sec: 'Jharkhand, India' },
  { main: 'Amritsar', sec: 'Punjab, India' },
  { main: 'Navi Mumbai', sec: 'Maharashtra, India' },
  { main: 'Allahabad', sec: 'Uttar Pradesh, India' },
  { main: 'Prayagraj', sec: 'Uttar Pradesh, India' },
  { main: 'Ranchi', sec: 'Jharkhand, India' },
  { main: 'Howrah', sec: 'West Bengal, India' },
  { main: 'Coimbatore', sec: 'Tamil Nadu, India' },
  { main: 'Jabalpur', sec: 'Madhya Pradesh, India' },
  { main: 'Gwalior', sec: 'Madhya Pradesh, India' },
  { main: 'Vijayawada', sec: 'Andhra Pradesh, India' },
  { main: 'Jodhpur', sec: 'Rajasthan, India' },
  { main: 'Madurai', sec: 'Tamil Nadu, India' },
  { main: 'Raipur', sec: 'Chhattisgarh, India' },
  { main: 'Kota', sec: 'Rajasthan, India' },
  // Rajasthan cities (the user explicitly mentioned Ajmer)
  { main: 'Ajmer', sec: 'Rajasthan, India' },
  { main: 'Udaipur', sec: 'Rajasthan, India' },
  { main: 'Bikaner', sec: 'Rajasthan, India' },
  { main: 'Alwar', sec: 'Rajasthan, India' },
  { main: 'Bharatpur', sec: 'Rajasthan, India' },
  { main: 'Sikar', sec: 'Rajasthan, India' },
  { main: 'Pali', sec: 'Rajasthan, India' },
  { main: 'Tonk', sec: 'Rajasthan, India' },
  { main: 'Beawar', sec: 'Rajasthan, India' },
  { main: 'Kishangarh', sec: 'Rajasthan, India' },
  { main: 'Pushkar', sec: 'Rajasthan, India' },
  { main: 'Chittorgarh', sec: 'Rajasthan, India' },
  { main: 'Bhilwara', sec: 'Rajasthan, India' },
  { main: 'Sri Ganganagar', sec: 'Rajasthan, India' },
  { main: 'Hanumangarh', sec: 'Rajasthan, India' },
  { main: 'Jhunjhunu', sec: 'Rajasthan, India' },
  // More tier-2/3 cities across India
  { main: 'Guwahati', sec: 'Assam, India' },
  { main: 'Shillong', sec: 'Meghalaya, India' },
  { main: 'Bhubaneswar', sec: 'Odisha, India' },
  { main: 'Cuttack', sec: 'Odisha, India' },
  { main: 'Visakhapatnam', sec: 'Andhra Pradesh, India' },
  { main: 'Tirupati', sec: 'Andhra Pradesh, India' },
  { main: 'Mysuru', sec: 'Karnataka, India' },
  { main: 'Mysore', sec: 'Karnataka, India' },
  { main: 'Mangaluru', sec: 'Karnataka, India' },
  { main: 'Mangalore', sec: 'Karnataka, India' },
  { main: 'Hubli', sec: 'Karnataka, India' },
  { main: 'Belgaum', sec: 'Karnataka, India' },
  { main: 'Gulbarga', sec: 'Karnataka, India' },
  { main: 'Thrissur', sec: 'Kerala, India' },
  { main: 'Kochi', sec: 'Kerala, India' },
  { main: 'Cochin', sec: 'Kerala, India' },
  { main: 'Kozhikode', sec: 'Kerala, India' },
  { main: 'Calicut', sec: 'Kerala, India' },
  { main: 'Thiruvananthapuram', sec: 'Kerala, India' },
  { main: 'Trivandrum', sec: 'Kerala, India' },
  { main: 'Kollam', sec: 'Kerala, India' },
  { main: 'Kannur', sec: 'Kerala, India' },
  { main: 'Alappuzha', sec: 'Kerala, India' },
  { main: 'Madurai', sec: 'Tamil Nadu, India' },
  { main: 'Tiruchirappalli', sec: 'Tamil Nadu, India' },
  { main: 'Trichy', sec: 'Tamil Nadu, India' },
  { main: 'Salem', sec: 'Tamil Nadu, India' },
  { main: 'Erode', sec: 'Tamil Nadu, India' },
  { main: 'Vellore', sec: 'Tamil Nadu, India' },
  { main: 'Tirunelveli', sec: 'Tamil Nadu, India' },
  { main: 'Thoothukudi', sec: 'Tamil Nadu, India' },
  { main: 'Tuticorin', sec: 'Tamil Nadu, India' },
  { main: 'Dindigul', sec: 'Tamil Nadu, India' },
  { main: 'Thanjavur', sec: 'Tamil Nadu, India' },
  { main: 'Kumbakonam', sec: 'Tamil Nadu, India' },
  { main: 'Kanyakumari', sec: 'Tamil Nadu, India' },
  { main: 'Ooty', sec: 'Tamil Nadu, India' },
  { main: 'Udhagamandalam', sec: 'Tamil Nadu, India' },
  { main: 'Warangal', sec: 'Telangana, India' },
  { main: 'Nizamabad', sec: 'Telangana, India' },
  { main: 'Karimnagar', sec: 'Telangana, India' },
  { main: 'Khammam', sec: 'Telangana, India' },
  { main: 'Tirupati', sec: 'Andhra Pradesh, India' },
  { main: 'Guntur', sec: 'Andhra Pradesh, India' },
  { main: 'Nellore', sec: 'Andhra Pradesh, India' },
  { main: 'Kurnool', sec: 'Andhra Pradesh, India' },
  { main: 'Kakinada', sec: 'Andhra Pradesh, India' },
  { main: 'Tirupati', sec: 'Andhra Pradesh, India' },
  { main: 'Panaji', sec: 'Goa, India' },
  { main: 'Margao', sec: 'Goa, India' },
  { main: 'Vasco da Gama', sec: 'Goa, India' },
  { main: 'Chandigarh', sec: 'India' },
  { main: 'Shimla', sec: 'Himachal Pradesh, India' },
  { main: 'Manali', sec: 'Himachal Pradesh, India' },
  { main: 'Dehradun', sec: 'Uttarakhand, India' },
  { main: 'Haridwar', sec: 'Uttarakhand, India' },
  { main: 'Rishikesh', sec: 'Uttarakhand, India' },
  { main: 'Nainital', sec: 'Uttarakhand, India' },
  { main: 'Haldwani', sec: 'Uttarakhand, India' },
  { main: 'Gurugram', sec: 'Haryana, India' },
  { main: 'Gurgaon', sec: 'Haryana, India' },
  { main: 'Panipat', sec: 'Haryana, India' },
  { main: 'Ambala', sec: 'Haryana, India' },
  { main: 'Karnal', sec: 'Haryana, India' },
  { main: 'Hisar', sec: 'Haryana, India' },
  { main: 'Rohtak', sec: 'Haryana, India' },
  { main: 'Sonipat', sec: 'Haryana, India' },
  { main: 'Noida', sec: 'Uttar Pradesh, India' },
  { main: 'Greater Noida', sec: 'Uttar Pradesh, India' },
  { main: 'Ghaziabad', sec: 'Uttar Pradesh, India' },
  { main: 'Aligarh', sec: 'Uttar Pradesh, India' },
  { main: 'Bareilly', sec: 'Uttar Pradesh, India' },
  { main: 'Moradabad', sec: 'Uttar Pradesh, India' },
  { main: 'Saharanpur', sec: 'Uttar Pradesh, India' },
  { main: 'Gorakhpur', sec: 'Uttar Pradesh, India' },
  { main: 'Mathura', sec: 'Uttar Pradesh, India' },
  { main: 'Vrindavan', sec: 'Uttar Pradesh, India' },
  { main: 'Ayodhya', sec: 'Uttar Pradesh, India' },
  { main: 'Faizabad', sec: 'Uttar Pradesh, India' },
  { main: 'Firozabad', sec: 'Uttar Pradesh, India' },
  { main: 'Jhansi', sec: 'Uttar Pradesh, India' },
  { main: 'Raebareli', sec: 'Uttar Pradesh, India' },
  { main: 'Sultanpur', sec: 'Uttar Pradesh, India' },
  { main: 'Muzaffarnagar', sec: 'Uttar Pradesh, India' },
  { main: 'Bhiwani', sec: 'Haryana, India' },
  { main: 'Siliguri', sec: 'West Bengal, India' },
  { main: 'Durgapur', sec: 'West Bengal, India' },
  { main: 'Asansol', sec: 'West Bengal, India' },
  { main: 'Darjeeling', sec: 'West Bengal, India' },
  { main: 'Kharagpur', sec: 'West Bengal, India' },
  { main: 'Bardhaman', sec: 'West Bengal, India' },
  { main: 'Malda', sec: 'West Bengal, India' },
  { main: 'Jamshedpur', sec: 'Jharkhand, India' },
  { main: 'Bokaro', sec: 'Jharkhand, India' },
  { main: 'Hazaribagh', sec: 'Jharkhand, India' },
  { main: 'Deoghar', sec: 'Jharkhand, India' },
  { main: 'Bhilai', sec: 'Chhattisgarh, India' },
  { main: 'Bilaspur', sec: 'Chhattisgarh, India' },
  { main: 'Raipur', sec: 'Chhattisgarh, India' },
  { main: 'Gaya', sec: 'Bihar, India' },
  { main: 'Bhagalpur', sec: 'Bihar, India' },
  { main: 'Muzaffarpur', sec: 'Bihar, India' },
  { main: 'Darbhanga', sec: 'Bihar, India' },
  { main: 'Purnia', sec: 'Bihar, India' },
  { main: 'Begusarai', sec: 'Bihar, India' },
  { main: 'Katihar', sec: 'Bihar, India' },
  // North-East
  { main: 'Guwahati', sec: 'Assam, India' },
  { main: 'Dibrugarh', sec: 'Assam, India' },
  { main: 'Jorhat', sec: 'Assam, India' },
  { main: 'Silchar', sec: 'Assam, India' },
  { main: 'Tezpur', sec: 'Assam, India' },
  { main: 'Tinsukia', sec: 'Assam, India' },
  { main: 'Nagaon', sec: 'Assam, India' },
  { main: 'Itanagar', sec: 'Arunachal Pradesh, India' },
  { main: 'Dimapur', sec: 'Nagaland, India' },
  { main: 'Kohima', sec: 'Nagaland, India' },
  { main: 'Imphal', sec: 'Manipur, India' },
  { main: 'Aizawl', sec: 'Mizoram, India' },
  { main: 'Agartala', sec: 'Tripura, India' },
  { main: 'Shillong', sec: 'Meghalaya, India' },
  // Other / Islands
  { main: 'Port Blair', sec: 'Andaman & Nicobar, India' },
  { main: 'Leh', sec: 'Ladakh, India' },
  { main: 'Kargil', sec: 'Ladakh, India' },
  { main: 'Jammu', sec: 'Jammu & Kashmir, India' },
  { main: 'Katva', sec: 'Jammu & Kashmir, India' },
  { main: 'Katrain', sec: 'Himachal Pradesh, India' },
  { main: 'Puducherry', sec: 'India' },
  { main: 'Pondicherry', sec: 'India' },
  { main: 'Diu', sec: 'India' },
  // Well-known areas within metros
  { main: 'Indiranagar', sec: 'Bengaluru, Karnataka' },
  { main: 'Koramangala', sec: 'Bengaluru, Karnataka' },
  { main: 'Whitefield', sec: 'Bengaluru, Karnataka' },
  { main: 'Jayanagar', sec: 'Bengaluru, Karnataka' },
  { main: 'Malleshwaram', sec: 'Bengaluru, Karnataka' },
  { main: 'HSR Layout', sec: 'Bengaluru, Karnataka' },
  { main: 'Marathahalli', sec: 'Bengaluru, Karnataka' },
  { main: 'Electronic City', sec: 'Bengaluru, Karnataka' },
  { main: 'Bandra West', sec: 'Mumbai, Maharashtra' },
  { main: 'Bandra East', sec: 'Mumbai, Maharashtra' },
  { main: 'Andheri West', sec: 'Mumbai, Maharashtra' },
  { main: 'Andheri East', sec: 'Mumbai, Maharashtra' },
  { main: 'Juhu', sec: 'Mumbai, Maharashtra' },
  { main: 'Dadar', sec: 'Mumbai, Maharashtra' },
  { main: 'Powai', sec: 'Mumbai, Maharashtra' },
  { main: 'Goregaon', sec: 'Mumbai, Maharashtra' },
  { main: 'Thane', sec: 'Maharashtra, India' },
  { main: 'Connaught Place', sec: 'New Delhi, Delhi' },
  { main: 'Karol Bagh', sec: 'Delhi, India' },
  { main: 'Lajpat Nagar', sec: 'Delhi, India' },
  { main: 'Saket', sec: 'Delhi, India' },
  { main: 'Hauz Khas', sec: 'Delhi, India' },
  { main: 'Rohini', sec: 'Delhi, India' },
  { main: 'Dwarka', sec: 'Delhi, India' },
  { main: 'Pitampura', sec: 'Delhi, India' },
  { main: 'Vasant Kunj', sec: 'Delhi, India' },
  { main: 'Banjara Hills', sec: 'Hyderabad, Telangana' },
  { main: 'Jubilee Hills', sec: 'Hyderabad, Telangana' },
  { main: 'Gachibowli', sec: 'Hyderabad, Telangana' },
  { main: 'Madhapur', sec: 'Hyderabad, Telangana' },
  { main: 'Kondapur', sec: 'Hyderabad, Telangana' },
  { main: 'Kukatpally', sec: 'Hyderabad, Telangana' },
  { main: 'Anna Nagar', sec: 'Chennai, Tamil Nadu' },
  { main: 'T Nagar', sec: 'Chennai, Tamil Nadu' },
  { main: 'Adyar', sec: 'Chennai, Tamil Nadu' },
  { main: 'Velachery', sec: 'Chennai, Tamil Nadu' },
  { main: 'Besant Nagar', sec: 'Chennai, Tamil Nadu' },
  { main: 'Salt Lake', sec: 'Kolkata, West Bengal' },
  { main: 'New Town', sec: 'Kolkata, West Bengal' },
  { main: 'Park Street', sec: 'Kolkata, West Bengal' },
  { main: 'Gariahat', sec: 'Kolkata, West Bengal' },
]

async function reverseGeocode(lat: number, lng: number): Promise<{ formatted: string; area: string; city: string } | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 0 } })
      if (res.ok) {
        const data = await res.json()
        const r = data.results?.[0]
        if (r) {
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
            formatted: r.formatted_address,
            area: area || (comps[0]?.long_name ?? ''),
            city: city || (comps[1]?.long_name ?? ''),
          }
        }
      }
    } catch {
      // fall through
    }
  }
  // Fallback: deterministic mock based on coordinates — find nearest known place
  let best: { main: string; sec: string } | null = null
  let bestDist = Infinity
  // Approximate lat/lng for a handful of well-known places (good enough for fallback)
  const COORDS: Record<string, [number, number]> = {
    Mumbai: [19.07, 72.87],
    Delhi: [28.61, 77.21],
    Bengaluru: [12.97, 77.59],
    Hyderabad: [17.38, 78.48],
    Chennai: [13.08, 80.27],
    Kolkata: [22.57, 88.36],
    Pune: [18.52, 73.85],
    Ahmedabad: [23.02, 72.57],
    Jaipur: [26.91, 75.78],
    Lucknow: [26.85, 80.95],
    Ajmer: [26.45, 74.64],
    Kota: [25.21, 75.86],
    Udaipur: [24.59, 73.69],
    Jodhpur: [26.29, 73.02],
    Surat: [21.17, 72.83],
    Nagpur: [21.15, 79.09],
    Bhopal: [23.26, 77.41],
    Patna: [25.61, 85.14],
    Indore: [22.72, 75.86],
    Chandigarh: [30.73, 76.78],
    Kochi: [9.93, 76.27],
    Coimbatore: [11.02, 76.96],
    Guwahati: [26.14, 91.74],
    Bhubaneswar: [20.27, 85.84],
    Visakhapatnam: [17.69, 83.22],
    Ranchi: [23.36, 85.33],
    Raipur: [21.25, 81.63],
    Dehradun: [30.32, 78.03],
    Shimla: [31.1, 77.17],
    Srinagar: [34.08, 74.8],
    Jammu: [32.73, 74.86],
    Leh: [34.15, 77.58],
    Panaji: [15.49, 73.83],
    Shillong: [25.58, 91.89],
    Imphal: [24.82, 93.94],
    Agartala: [23.83, 91.28],
    Aizawl: [23.73, 92.72],
    Kohima: [25.67, 94.11],
    Dimapur: [25.91, 93.73],
    Itanagar: [27.08, 93.61],
    Port_Blair: [11.62, 92.73],
  }
  for (const [name, [clat, clng]] of Object.entries(COORDS)) {
    const d = (clat - lat) ** 2 + (clng - lng) ** 2
    if (d < bestDist) {
      bestDist = d
      best = { main: name.replace(/_/g, ' '), sec: 'India' }
    }
  }
  if (best) {
    return {
      formatted: `${best.main}, India`,
      area: best.main,
      city: best.main,
    }
  }
  // Last resort fallback
  const areaNames = ['Indiranagar', 'Bandra West', 'Koramangala', 'Connaught Place', 'Banjara Hills', 'Salt Lake', 'MG Road', 'Anna Nagar']
  const cityNames = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Chennai', 'Pune', 'Jaipur']
  const h = hashStr(`${lat.toFixed(2)},${lng.toFixed(2)}`)
  return {
    formatted: `${areaNames[h % areaNames.length]}, ${cityNames[(h >> 4) % cityNames.length]}, India`,
    area: areaNames[h % areaNames.length],
    city: cityNames[(h >> 4) % cityNames.length],
  }
}

async function autocompleteArea(q: string): Promise<AreaSuggestion[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        q
      )}&types=(cities)&components=country:in&key=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 86400 } })
      if (res.ok) {
        const data = await res.json()
        return (data.predictions || []).slice(0, 6).map((p: any) => ({
          description: p.description,
          placeId: p.place_id || null,
          mainText: p.structured_formatting?.main_text || p.description,
          secondaryText: p.structured_formatting?.secondary_text || '',
          lat: null,
          lng: null,
        }))
      }
    } catch {
      // fall through
    }
  }
  // Fallback: filter the comprehensive INDIAN_PLACES list
  const ql = q.toLowerCase().trim()
  const matched = INDIAN_PLACES.filter(
    (a) => a.main.toLowerCase().includes(ql) || a.sec.toLowerCase().includes(ql)
  ).slice(0, 6)

  const suggestions: AreaSuggestion[] = matched.map((a) => ({
    description: `${a.main}, ${a.sec}`,
    placeId: null,
    mainText: a.main,
    secondaryText: a.sec,
    lat: null,
    lng: null,
  }))

  // ALWAYS ensure at least one suggestion — the user's typed query itself.
  // This guarantees the autocomplete dropdown is never empty for any area,
  // including tiny towns/villages not in our list. The user can click it to
  // confirm their location and proceed with the doctor search.
  const alreadyHas = suggestions.some(
    (s) => s.mainText.toLowerCase() === ql || s.description.toLowerCase() === ql
  )
  if (!alreadyHas && ql.length >= 2) {
    // Capitalize first letter of each word for nicer display
    const pretty = q
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
    suggestions.unshift({
      description: `${pretty}, India`,
      placeId: null,
      mainText: pretty,
      secondaryText: 'India',
      lat: null,
      lng: null,
    })
  }

  return suggestions
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const q = searchParams.get('q')?.trim() || ''

  // Reverse geocode
  if (lat && lng) {
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      return NextResponse.json({ ok: false, error: 'Invalid lat/lng' }, { status: 400 })
    }
    const result = await reverseGeocode(latNum, lngNum)
    if (!result) {
      return NextResponse.json({ ok: false, error: 'Could not reverse geocode' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, ...result, lat: latNum, lng: lngNum })
  }

  // Autocomplete
  if (q.length < 2) {
    return NextResponse.json({ ok: true, suggestions: [] })
  }
  const suggestions = await autocompleteArea(q)
  return NextResponse.json({ ok: true, suggestions })
}
