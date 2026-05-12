import axios from 'axios'

const API_KEY = import.meta.env.VITE_SEOUL_API_KEY

// In production: Vercel rewrites `/seoul-api/*` → http://openapi.seoul.go.kr:8088/*
// (so the browser only makes same-origin https calls, avoiding mixed-content).
// In dev: configure the same path in vite.config to proxy through localhost.
const BASE = '/seoul-api'

// 시설대관 - 기관시설
export const fetchInstitutionFacilities = async () => {
  try {
    const response = await axios.get(
      `${BASE}/${API_KEY}/json/ListPublicReservationInstitution/1/100/`
    )
    return response.data
  } catch (error) {
    console.error('기관시설 데이터 불러오기 실패:', error)
    return null
  }
}

// 시설대관 - 문화행사
export const fetchCultureEvents = async () => {
  try {
    const response = await axios.get(
      `${BASE}/${API_KEY}/json/ListPublicReservationCulture/1/100/`
    )
    return response.data
  } catch (error) {
    console.error('문화행사 데이터 불러오기 실패:', error)
    return null
  }
}
