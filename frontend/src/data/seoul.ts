import axios from 'axios'

const API_KEY = import.meta.env.VITE_SEOUL_API_KEY

// 시설대관 공공서비스예약 정보
export const fetchFacilities = async () => {
  try {
    const response = await axios.get(
      `http://openapi.seoul.go.kr:8088/${API_KEY}/json/ListPublicReservationSport/1/100/`
    )
    return response.data
  } catch (error) {
    console.error('시설 데이터 불러오기 실패:', error)
    return null
  }
}

// 시설대관 - 문화행사
export const fetchCultureEvents = async () => {
  try {
    const response = await axios.get(
      `http://openapi.seoul.go.kr:8088/${API_KEY}/json/ListPublicReservationCulture/1/100/`
    )
    return response.data
  } catch (error) {
    console.error('문화행사 데이터 불러오기 실패:', error)
    return null
  }
}