
const game = document.getElementById("game-container");
const basket = document.getElementById("basket");
const apple = document.getElementById("apple");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const bestText = document.getElementById("best-score");

const message = document.getElementById("message");
const messageTitle = document.getElementById("message-title");
const messageText = document.getElementById("message-text");
const playerInput = document.getElementById("player-name");
const startBtn = document.getElementById("start-btn");
const leaderboard = document.getElementById("leaderboard-list");

const APPLE_SIZE = 36;
const BASKET_WIDTH = 80;
const BASKET_HEIGHT = 42;

let basketX = 210;
let appleX = 100;
let appleY = 0;

let score = 0;
let lives = 3;
let fallSpeed = 2.2;

let playerName = "";
let leftPressed = false;
let rightPressed = false;
let running = false;
let animationId = null;
let lastFrame = 0;

// Lấy dữ liệu xếp hạng đã lưu
function getRanking() {
    try {
        const data = JSON.parse(
            localStorage.getItem("appleCatcherRanking") || "[]"
        );

        return Array.isArray(data)
            ? data.filter(item =>
                item &&
                typeof item.name === "string" &&
                Number.isFinite(item.score) &&
                item.score >= 0
            )
            : [];
    } catch {
        return [];
    }
}

// Hiển thị bảng xếp hạng TOP 5
function renderRanking() {
    const ranking = getRanking()
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    leaderboard.replaceChildren();

    if (ranking.length === 0) {
        leaderboard.innerHTML = `
            <div class="empty-rank">
                🍎<br><br>
                Chưa có thành tích nào.<br>
                Hãy là người đầu tiên!
            </div>
        `;
        return;
    }

    ranking.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = `rank-row rank-${index + 1}`;

        const number = document.createElement("div");
        number.className = "rank-number";
        number.textContent = ["🥇", "🥈", "🥉", "4", "5"][index];

        const details = document.createElement("div");
        details.className = "rank-details";

        const name = document.createElement("div");
        name.className = "rank-name";
        name.textContent = item.name;

        const date = document.createElement("div");
        date.className = "rank-date";
        date.textContent = item.date || "Người chơi";

        const points = document.createElement("div");
        points.className = "rank-points";
        points.textContent = item.score + " điểm";

        details.append(name, date);
        row.append(number, details, points);
        leaderboard.appendChild(row);
    });
}

// Lưu thành tích khi kết thúc
function saveRanking() {
    if (score <= 0) return;

    const ranking = getRanking();

    ranking.push({
        name: playerName,
        score: score,
        date: new Date().toLocaleDateString("vi-VN")
    });

    ranking.sort((a, b) => b.score - a.score);

    try {
        localStorage.setItem(
            "appleCatcherRanking",
            JSON.stringify(ranking.slice(0, 5))
        );
    } catch (error) {
        console.warn("Không thể lưu bảng xếp hạng.", error);
    }

    renderRanking();
    updateBestScore();
}

function updateBestScore() {
    const ranking = getRanking();
    const best = ranking.reduce(
        (max, item) => Math.max(max, item.score), 0
    );

    bestText.textContent = best;
}

function updateInfo() {
    scoreText.textContent = score;
    livesText.textContent = lives;
    updateBestScore();
}

// Đặt táo ở vị trí ngẫu nhiên trên đỉnh
function resetApple() {
    const width = game.clientWidth;
    appleX = Math.random() * Math.max(0, width - APPLE_SIZE);
    appleY = 0;

    apple.style.left = appleX + "px";
    apple.style.top = appleY + "px";
}

// Di chuyển giỏ, không cho ra ngoài khung
function updateBasket(delta) {
    const width = game.clientWidth;
    const speed = 320 * delta;

    if (leftPressed) basketX -= speed;
    if (rightPressed) basketX += speed;

    basketX = Math.max(
        0,
        Math.min(width - BASKET_WIDTH, basketX)
    );

    basket.style.left = basketX + "px";
}

// Kiểm tra va chạm giữa táo và giỏ
function checkCollision() {
    const basketY =
        game.clientHeight - 8 - BASKET_HEIGHT;

    return (
        appleX + APPLE_SIZE > basketX &&
        appleX < basketX + BASKET_WIDTH &&
        appleY + APPLE_SIZE >= basketY &&
        appleY < basketY + BASKET_HEIGHT
    );
}

function endGame() {
    running = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    apple.style.display = "none";
    saveRanking();

    messageTitle.textContent = "GAME OVER!";
    messageText.textContent =
        `${playerName}, bạn đạt ${score} điểm!`;

    startBtn.textContent = "↻ CHƠI LẠI";
    message.style.display = "flex";
}

function gameLoop(timestamp) {
    if (!running) return;

    // Giữ tốc độ tương đối ổn định trên các màn hình
    const delta = lastFrame
        ? Math.min((timestamp - lastFrame) / 1000, 0.04)
        : 0;

    lastFrame = timestamp;

    updateBasket(delta);

    appleY += fallSpeed * delta * 60;
    apple.style.top = appleY + "px";

    if (checkCollision()) {
        score++;
        fallSpeed += 0.12;

        updateInfo();
        resetApple();
    } else if (appleY + APPLE_SIZE >= game.clientHeight) {
        lives--;
        updateInfo();

        if (lives <= 0) {
            endGame();
            return;
        }

        resetApple();
    }

    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    if (running) return;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    playerName = playerInput.value.trim() || "Người chơi";

    score = 0;
    lives = 3;
    fallSpeed = 2.2;

    basketX = (game.clientWidth - BASKET_WIDTH) / 2;
    leftPressed = false;
    rightPressed = false;
    lastFrame = 0;

    basket.style.left = basketX + "px";

    updateInfo();
    resetApple();

    message.style.display = "none";
    apple.style.display = "block";

    running = true;
    animationId = requestAnimationFrame(gameLoop);
}

// Điều khiển bằng bàn phím
document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowLeft" ||
        event.key === "ArrowRight") {
        event.preventDefault();
    }

    if (event.key === "ArrowLeft") leftPressed = true;
    if (event.key === "ArrowRight") rightPressed = true;
});

document.addEventListener("keyup", function(event) {
    if (event.key === "ArrowLeft") leftPressed = false;
    if (event.key === "ArrowRight") rightPressed = false;
});

window.addEventListener("blur", function() {
    leftPressed = false;
    rightPressed = false;
});

startBtn.addEventListener("click", startGame);

playerInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") startGame();
});

// Khởi tạo game
renderRanking();
updateInfo();
