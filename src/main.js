import './style.css'

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const API_URL = 'https://api.openai.com/v1/chat/completions'

let chatHistory = []

// API 상태 확인
async function checkApiStatus() {
  const statusIndicator = document.getElementById('apiStatusIndicator')
  const statusText = document.getElementById('apiStatusText')

  if (!API_KEY) {
    statusIndicator.classList.add('status-error')
    statusText.textContent = 'API Key 설정 필요'
    statusText.style.color = '#ff6b6b'
    return false
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
    })

    if (response.ok) {
      statusIndicator.classList.add('status-active')
      statusText.textContent = 'API 정상 작동 중'
      statusText.style.color = '#51cf66'
      return true
    } else if (response.status === 401) {
      statusIndicator.classList.add('status-error')
      statusText.textContent = 'API Key 오류'
      statusText.style.color = '#ff6b6b'
      return false
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    statusIndicator.classList.add('status-warning')
    statusText.textContent = '연결 상태 확인'
    statusText.style.color = '#ffd43b'
    console.log('API 확인 중 오류:', error)
    return true
  }
}

// 챗봇에게 메시지 전송
async function sendMessage(userMessage) {
  const chatHistoryDiv = document.getElementById('chatHistory')
  const userInput = document.getElementById('userInput')
  const sendButton = document.getElementById('sendButton')

  if (!userMessage.trim()) return

  // 사용자 메시지 추가
  chatHistory.push({
    role: 'user',
    content: userMessage
  })

  // 화면에 사용자 메시지 표시
  const userMessageDiv = document.createElement('div')
  userMessageDiv.className = 'message user-message'
  userMessageDiv.innerHTML = `<p>${userMessage}</p>`
  chatHistoryDiv.appendChild(userMessageDiv)

  userInput.value = ''
  sendButton.disabled = true
  sendButton.textContent = '전송 중...'

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 친근한 저녁 메뉴 추천 전문가입니다. 사용자의 요청에 따라 맛있는 저녁 메뉴를 추천해주세요. 간단하고 친절하게 답변해주세요.'
          },
          ...chatHistory
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`)
    }

    const data = await response.json()
    const botMessage = data.choices[0].message.content

    // 봇 메시지를 chatHistory에 추가
    chatHistory.push({
      role: 'assistant',
      content: botMessage
    })

    // 화면에 봇 메시지 표시
    const botMessageDiv = document.createElement('div')
    botMessageDiv.className = 'message bot-message'
    botMessageDiv.innerHTML = `<p>${botMessage}</p>`
    chatHistoryDiv.appendChild(botMessageDiv)

    // 스크롤을 최하단으로
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight
  } catch (error) {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'message error-message'
    errorDiv.innerHTML = `<p>오류가 발생했습니다: ${error.message}</p>`
    chatHistoryDiv.appendChild(errorDiv)
    console.error('오류:', error)
  } finally {
    sendButton.disabled = false
    sendButton.textContent = '전송'
    userInput.focus()
  }
}

// 이벤트 리스너
document.getElementById('sendButton').addEventListener('click', () => {
  const userMessage = document.getElementById('userInput').value
  sendMessage(userMessage)
})

document.getElementById('userInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    const userMessage = document.getElementById('userInput').value
    sendMessage(userMessage)
  }
})

// 초기 실행
checkApiStatus()
