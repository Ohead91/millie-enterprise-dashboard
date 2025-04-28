// 문해력 평가 기능 구현
document.addEventListener("DOMContentLoaded", function () {
  // DOM 요소 참조
  const startLiteracyTestBtn = document.getElementById("start-literacy-test");
  const literacyTestModal = document.getElementById("literacy-test-modal");
  const closeBtn = document.getElementById("close-literacy-test");
  const prevBtn = document.getElementById("prev-question");
  const nextBtn = document.getElementById("next-question");
  const questionContainer = document.getElementById("question-container");
  const resultContainer = document.getElementById("result-container");
  const currentQuestionEl = document.getElementById("current-question");
  const totalQuestionsEl = document.getElementById("total-questions");
  const progressBar = document.getElementById("progress-bar");

  // 상태 관리 변수
  let questions = []; // 문제 데이터
  let currentQuestion = 0; // 현재 문제 인덱스
  let userAnswers = []; // 사용자 응답 기록
  const totalQuestions = 15; // 전체 문제 수

  // 모달 열기
  function openModal() {
    literacyTestModal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // 배경 스크롤 방지
  }

  // 모달 닫기
  function closeModal() {
    literacyTestModal.classList.add("hidden");
    document.body.style.overflow = "auto";
    // 테스트 상태 초기화
    resetTest();
  }

  // 테스트 초기화
  function resetTest() {
    currentQuestion = 0;
    userAnswers = [];
    questionContainer.classList.remove("hidden");
    resultContainer.classList.add("hidden");
    updateProgressBar();
  }

  // 문제 데이터 로드
  async function loadQuestions() {
    try {
      const response = await fetch("quiz/literacy_questions.json");
      if (!response.ok) {
        throw new Error("문제 데이터를 불러올 수 없습니다.");
      }

      questions = await response.json();
      totalQuestionsEl.textContent = questions.length;
      showQuestion(currentQuestion);
    } catch (error) {
      console.error("문제 로드 중 오류 발생:", error);
      questionContainer.innerHTML = `
          <div class="bg-red-50 p-4 rounded-md text-red-800">
            <p class="font-medium">문제를 불러올 수 없습니다.</p>
            <p>잠시 후 다시 시도해 주세요.</p>
          </div>
        `;
    }
  }

  // 문제 표시
  function showQuestion(index) {
    if (!questions || !questions[index]) return;

    const question = questions[index];
    currentQuestionEl.textContent = index + 1;
    updateProgressBar();

    // 문제 내용 구성
    let optionsHtml = "";
    if (question.options && question.options.length) {
      optionsHtml = question.options
        .map((option, i) => {
          const optionId = `option-${index}-${i}`;
          const selected = userAnswers[index] === i ? "selected" : "";
          const label = String.fromCharCode(65 + i); // A, B, C, D...

          return `
            <div class="option-container">
              <label for="${optionId}" class="option-label ${selected}">
                <input 
                  type="radio" 
                  name="question-${index}" 
                  id="${optionId}" 
                  value="${i}" 
                  class="option-radio"
                  ${userAnswers[index] === i ? "checked" : ""}
                >
                <span class="option-bullet">${label}</span>
                <span class="option-text">${option}</span>
              </label>
            </div>
          `;
        })
        .join("");
    }

    // 문제 HTML 구성
    questionContainer.innerHTML = `
        ${
          question.imageUrl
            ? `<img src="${question.imageUrl}" alt="문제 이미지" class="question-image">`
            : ""
        }
        <div class="question-text">${index + 1}. ${question.text}</div>
        ${
          question.context
            ? `<div class="mb-4 p-4 bg-gray-50 rounded-md">${question.context}</div>`
            : ""
        }
        <div class="options-container">${optionsHtml}</div>
      `;

    // 옵션 클릭 이벤트 처리
    document.querySelectorAll(".option-label").forEach((label) => {
      label.addEventListener("click", function () {
        const radio = this.querySelector('input[type="radio"]');
        if (radio) {
          document
            .querySelectorAll(`input[name="${radio.name}"]`)
            .forEach((input) => {
              input.closest(".option-label").classList.remove("selected");
            });
          this.classList.add("selected");
          userAnswers[index] = parseInt(radio.value);

          // 마지막 문제에서 '다음' 버튼 텍스트 변경
          if (currentQuestion === questions.length - 1) {
            nextBtn.innerHTML = '결과 보기 <i class="fas fa-check ml-2"></i>';
          }
        }
      });
    });

    // 이전/다음 버튼 상태 업데이트
    prevBtn.disabled = index === 0;
    if (prevBtn.disabled) {
      prevBtn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      prevBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }

  // 진행 상태 표시줄 업데이트
  function updateProgressBar() {
    const progress = ((currentQuestion + 1) / totalQuestions) * 100;
    progressBar.style.width = `${progress}%`;
  }

  // 이전 문제로 이동
  function goToPrevQuestion() {
    if (currentQuestion > 0) {
      currentQuestion--;
      showQuestion(currentQuestion);

      // 결과 화면에서 돌아온 경우 UI 업데이트
      if (resultContainer.classList.contains("hidden") === false) {
        resultContainer.classList.add("hidden");
        questionContainer.classList.remove("hidden");
        nextBtn.innerHTML = '다음 문제 <i class="fas fa-arrow-right ml-2"></i>';
      }
    }
  }

  // 다음 문제로 이동
  function goToNextQuestion() {
    // 현재 문제에 답변했는지 확인
    if (userAnswers[currentQuestion] === undefined) {
      alert("문제에 답변해 주세요.");
      return;
    }

    if (currentQuestion < questions.length - 1) {
      // 다음 문제로 이동
      currentQuestion++;
      showQuestion(currentQuestion);
    } else {
      // 모든 문제 완료 - 결과 표시
      showResults();
    }
  }

  // 결과 표시
  function showResults() {
    questionContainer.classList.add("hidden");
    resultContainer.classList.remove("hidden");

    // 점수 계산 (간단한 예시)
    const correctAnswers = userAnswers.filter((answer, index) => {
      return answer === questions[index].correctAnswer;
    }).length;

    const score = Math.round((correctAnswers / questions.length) * 100);

    // 점수에 따른 레벨 결정
    let level, description;
    if (score >= 90) {
      level = "수준 4";
      description =
        "뛰어난 문해력을 갖추고 있습니다. 복잡한 텍스트를 이해하고 분석하는 능력이 탁월합니다.";
    } else if (score >= 70) {
      level = "수준 3";
      description =
        "양호한 문해력을 갖추고 있습니다. 대부분의 일상적인 텍스트를 이해하고 정보를 활용할 수 있습니다.";
    } else if (score >= 50) {
      level = "수준 2";
      description =
        "기본적인 문해력을 갖추고 있습니다. 간단한 텍스트를 이해할 수 있지만, 복잡한 내용은 어려움을 겪을 수 있습니다.";
    } else {
      level = "수준 1";
      description =
        "기초 문해력 향상이 필요합니다. 간단한 텍스트 이해에도 어려움을 겪을 수 있습니다.";
    }

    // 결과 HTML 구성
    resultContainer.innerHTML = `
        <div class="text-center mb-6">
          <h3 class="result-title">문해력 평가 결과</h3>
          <div class="result-score">${score}점</div>
          <div class="result-level">${level}</div>
          <p class="result-description">${description}</p>
        </div>
        
        <div class="bg-indigo-50 p-4 rounded-lg mb-6">
          <h4 class="font-medium text-indigo-800 mb-2">세부 결과</h4>
          <p class="text-sm text-gray-700">총 ${questions.length}문제 중 ${correctAnswers}문제 정답</p>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div class="bg-indigo-600 h-2 rounded-full" style="width: ${score}%"></div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h4 class="font-medium text-gray-800 mb-2">추천 독서</h4>
            <div class="space-y-2">
              <div class="flex items-center">
                <img src="/api/placeholder/40/56" alt="추천 도서" class="w-10 h-14 object-cover rounded mr-2">
                <div>
                  <p class="text-sm font-medium">효과적인 독해와 이해</p>
                  <p class="text-xs text-gray-600">김미래</p>
                </div>
              </div>
              <div class="flex items-center">
                <img src="/api/placeholder/40/56" alt="추천 도서" class="w-10 h-14 object-cover rounded mr-2">
                <div>
                  <p class="text-sm font-medium">정보 분석의 기술</p>
                  <p class="text-xs text-gray-600">이지원</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h4 class="font-medium text-gray-800 mb-2">다음 단계</h4>
            <ul class="space-y-2 text-sm">
              <li class="flex items-start">
                <span class="text-indigo-600 mr-2">•</span>
                <span>맞춤형 문해력 향상 프로그램 참여하기</span>
              </li>
              <li class="flex items-start">
                <span class="text-indigo-600 mr-2">•</span>
                <span>관련 북클럽에 참여하여 독서 습관 기르기</span>
              </li>
              <li class="flex items-start">
                <span class="text-indigo-600 mr-2">•</span>
                <span>정기적인 문해력 진단으로 발전 상황 확인하기</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div class="flex justify-center">
          <button id="close-result" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
            확인
          </button>
        </div>
      `;

    // 결과 닫기 버튼에 이벤트 리스너 추가
    document
      .getElementById("close-result")
      .addEventListener("click", closeModal);

    // 다음 버튼 텍스트 변경
    nextBtn.innerHTML = '다시 시작 <i class="fas fa-redo ml-2"></i>';
  }

  // 이벤트 리스너 등록
  if (startLiteracyTestBtn) {
    startLiteracyTestBtn.addEventListener("click", function () {
      openModal();
      resetTest();
      loadQuestions();
    });
  }

  closeBtn.addEventListener("click", closeModal);
  prevBtn.addEventListener("click", goToPrevQuestion);
  nextBtn.addEventListener("click", function () {
    if (resultContainer.classList.contains("hidden") === false) {
      // 결과 화면에서 다시 시작
      resetTest();
      loadQuestions();
    } else {
      goToNextQuestion();
    }
  });

  // 모달 외부 클릭 시 닫기
  literacyTestModal.addEventListener("click", function (e) {
    if (e.target === literacyTestModal) {
      closeModal();
    }
  });

  // ESC 키로 모달 닫기
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !literacyTestModal.classList.contains("hidden")) {
      closeModal();
    }
  });
});
