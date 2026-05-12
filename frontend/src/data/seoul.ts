import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

// 시설대관 - 기관시설 (서울시 공공예약 institution)
export const fetchInstitutionFacilities = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/spaces`)
    return response.data
  } catch (error) {
    console.error('기관시설 데이터 불러오기 실패:', error)
    return null
  }
}

// 시설대관 - 문화행사
export const fetchCultureEvents = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/culture`)
    return response.data
  } catch (error) {
    console.error('문화행사 데이터 불러오기 실패:', error)
    return null
  }
}
