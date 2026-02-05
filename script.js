let myChart;
let quotes = [];

async function loadQuotes() {
    try {
        const response = await fetch('quotes.md');
        const text = await response.text();

        // Parse file .md: tìm các dòng bắt đầu bằng dấu "-"
        const lines = text.split('\n');
        quotes = lines
            .filter(line => line.trim().startsWith('-'))
            .map(line => {
                const content = line.replace('-', '').trim();
                const [main, sub] = content.split('|').map(item => item.trim());
                return { main, sub };
            });

        shuffleQuote(); // Sau khi load xong thì hiển thị ngẫu nhiên
    } catch (error) {
        console.error("Lỗi khi tải file quotes.md:", error);
        // Dự phòng nếu lỗi load file
        quotes = [{ main: "HGPT STEEL", sub: "Success Together." }];
        shuffleQuote();
    }
}

function initDate() {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    document.getElementById('date-text').innerText = `${day}.${month}.${year}`;
}

function updateDashboard() {
    // Thu thập dữ liệu
    const vp = parseInt(document.getElementById('in-vp').value) || 0;
    const cd = parseInt(document.getElementById('in-cd').value) || 0;
    const bv = parseInt(document.getElementById('in-bv').value) || 0;
    const vptc = parseInt(document.getElementById('in-vptc').value) || 0;

    const sxtt_ct = parseInt(document.getElementById('in-sxtt-ct').value) || 0;
    const sxtt_nh = parseInt(document.getElementById('in-sxtt-nh').value) || 0;
    const kho = parseInt(document.getElementById('in-kho').value) || 0;
    const bt = parseInt(document.getElementById('in-bt').value) || 0;
    const sxtc_prev = parseInt(document.getElementById('in-sxtc-prev').value) || 0;
    const da = parseInt(document.getElementById('in-da').value) || 0;

    // Cập nhật lên Dashboard hiển thị số liệu
    document.getElementById('v-vp').innerText = vp.toString().padStart(2, '0');
    document.getElementById('v-cd').innerText = cd.toString().padStart(2, '0');
    document.getElementById('v-bv').innerText = bv.toString().padStart(2, '0');
    document.getElementById('v-vptc').innerText = vptc.toString().padStart(2, '0');

    document.getElementById('v-sxtt-ct').innerText = sxtt_ct.toString().padStart(2, '0');
    document.getElementById('v-sxtt-nh').innerText = sxtt_nh.toString().padStart(2, '0');
    document.getElementById('v-kho').innerText = kho.toString().padStart(2, '0');
    document.getElementById('v-bt').innerText = bt.toString().padStart(2, '0');
    document.getElementById('v-sxtc-prev').innerText = sxtc_prev.toString().padStart(2, '0');
    document.getElementById('v-da').innerText = da.toString().padStart(2, '0');

    // Vẽ biểu đồ: Chỉ truyền các nhóm nhân sự thực tế, loại trừ các ghi chú tăng ca/dự án
    // Theo yêu cầu: Tăng ca (vptc) và SX HGPT tại DA - CT (da) không tính vào tổng chia %
    // Ta sẽ gộp các nhóm nhân sự lại để biểu đồ đầy đủ và chính xác hơn
    const officeGroup = vp + cd + bv;
    const productionGroup = sxtt_ct + sxtt_nh + kho + bt;

    updateChart(officeGroup, productionGroup, sxtt_ct, sxtt_nh);
}

function updateChart(office, production, ct, nh) {
    // Để biểu đồ phản ánh đúng cơ cấu theo nhãn cũ nhưng tính toán đúng
    // Nhãn 1: Văn phòng (tổng VP + CD + BV)
    // Nhãn 2: Sản xuất chính thức
    // Nhãn 3: Sản xuất ngắn hạn
    // Nhãn 4: Khối hỗ trợ SX (Kho + Bảo trì)

    // Tuy nhiên để đơn giản và khớp với yêu cầu "không tính vptc và da", 
    // ta sẽ dùng 4 nhãn chính xác nhất:
    const vp_total = parseInt(document.getElementById('in-vp').value) || 0;
    const cd_total = parseInt(document.getElementById('in-cd').value) || 0;
    const sxtt_ct = parseInt(document.getElementById('in-sxtt-ct').value) || 0;
    const sxtt_nh = parseInt(document.getElementById('in-sxtt-nh').value) || 0;

    // Tính tổng thực tế bao gồm cả BV, Kho, BT nếu muốn đầy đủ 100% nhân sự
    const bv = parseInt(document.getElementById('in-bv').value) || 0;
    const kho = parseInt(document.getElementById('in-kho').value) || 0;
    const bt = parseInt(document.getElementById('in-bt').value) || 0;

    const data = [vp_total + bv, cd_total, sxtt_ct, sxtt_nh + kho + bt];
    const labels = ['Văn phòng & BV', 'Cấp dưỡng', 'SX chính thức', 'SX ngắn hạn & Phụ trợ'];
    const colors = ['#002d72', '#10b981', '#ed1c24', '#f39c12'];
    const total = data.reduce((a, b) => a + b, 0);
    document.getElementById('total-count').innerText = total;

    // Cập nhật Chú thích (Custom Legend)
    const legendContainer = document.getElementById('chart-legend');
    legendContainer.innerHTML = '';

    data.forEach((val, i) => {
        const percent = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <div class="legend-color" style="background: ${colors[i]}"></div>
            <span>${labels[i]}: <strong>${val}</strong> <span class="percent-tag">(${percent}%)</span></span>
        `;
        legendContainer.appendChild(item);
    });

    if (myChart) myChart.destroy();

    const ctx = document.getElementById('attendanceChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            cutout: '70%',
            animation: { animateRotate: true },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Phân loại thông điệp để lấy Icon và màu sắc phù hợp
function getCategoryInfo(text) {
    const combinedText = text.toLowerCase();
    const categories = [
        {
            keys: ['an toàn', 'safety', 'bảo hộ', 'về nhà'],
            label: "HGPT SAFETY",
            icon: "shield-check",
            color: "var(--hgpt-red)"
        },
        {
            keys: ['kỷ luật', 'quy trình', 'tác phong', 'đúng giờ'],
            label: "HGPT DISCIPLINE",
            icon: "scale",
            color: "#333"
        },
        {
            keys: ['nói sao làm vậy', 'tiến độ', 'chủng loại', 'thanh toán', 'chữ tín', 'chính xác'],
            label: "NÓI SAO LÀM VẬY",
            icon: "handshake",
            color: "var(--hgpt-blue)"
        },
        {
            keys: ['giải pháp tối ưu', 'thiết kế tối ưu', 'tiết kiệm', 'win - win', '5s', 'phối hợp'],
            label: "GIẢI PHÁP TỐI ƯU",
            icon: "lightbulb",
            color: "var(--hgpt-brown)"
        },
        {
            keys: ['trách nhiệm đến cùng', 'không bỏ rơi', 'không đổ lỗi', 'bảo hành', 'tận tâm', 'đồng hành'],
            label: "TRÁCH NHIỆM ĐẾN CÙNG",
            icon: "trophy",
            color: "var(--hgpt-red)"
        },
        {
            keys: ['tết', 'năm mới', 'xuân', 'chúc mừng'],
            label: "HGPT CELEBRATIONS",
            icon: "gift",
            color: "var(--hgpt-red)"
        },
        {
            keys: ['trải nghiệm khách hàng', 'khách hàng', 'phục vụ', 'thấu hiểu', 'xin lỗi', 'tiếp cận', 'phàn nàn', 'nguyên tắc'],
            label: "TRẢI NGHIỆM KHÁCH HÀNG",
            icon: "heart",
            color: "var(--hgpt-red)"
        }
    ];

    return categories.find(cat => cat.keys.some(key => combinedText.includes(key)));
}

function shuffleQuote() {
    if (quotes.length > 0) {
        const randomIdx = Math.floor(Math.random() * quotes.length);
        const q = quotes[randomIdx];

        document.getElementById('quote-line').innerText = q.main;
        document.getElementById('quote-sub').innerText = `"${q.sub}"`;

        // Đồng bộ lên bảng điều khiển
        document.getElementById('in-msg').value = q.main;
        document.getElementById('in-quote').value = q.sub;

        const labelElements = document.getElementById('v-label');
        const iconElement = document.getElementById('v-icon');

        const found = getCategoryInfo(q.main + " " + q.sub);

        if (found) {
            labelElements.innerText = found.label;
            iconElement.setAttribute('data-lucide', found.icon);
            labelElements.style.color = found.color;
        } else {
            const shortTitle = q.main.split(' ')[0].toUpperCase();
            labelElements.innerText = `HGPT ${shortTitle}`;
            iconElement.setAttribute('data-lucide', 'sparkles');
            labelElements.style.color = "var(--hgpt-brown)";
        }

        lucide.createIcons();
    }
}

function updateCustomQuote() {
    const msg = document.getElementById('in-msg').value;
    const quote = document.getElementById('in-quote').value;

    const displayMsg = document.getElementById('quote-line');
    const displayLabel = document.getElementById('v-label');
    const displaySub = document.getElementById('quote-sub');
    const displayIcon = document.getElementById('v-icon');

    if (msg) {
        displayMsg.innerText = msg;
        displayLabel.innerText = msg; // Đồng bộ nhãn với thông điệp chính
    }
    if (quote) displaySub.innerText = `"${quote}"`;

    const found = getCategoryInfo((msg || "") + " " + (quote || ""));
    if (found) {
        displayIcon.setAttribute('data-lucide', found.icon);
        displayLabel.style.color = found.color;
    } else {
        displayIcon.setAttribute('data-lucide', 'message-square');
        displayLabel.style.color = "var(--hgpt-brown)";
    }

    lucide.createIcons();
}

// Tăng/giảm giá trị của input số lượng
function changeValue(id, delta) {
    const input = document.getElementById(id);
    let val = parseInt(input.value) || 0;
    val += delta;
    if (val < 0) val = 0; // Không để giá trị âm
    input.value = val;
    updateDashboard();
}

// Khởi chạy
initDate();
updateDashboard();
loadQuotes();
lucide.createIcons();

async function takeScreenshot() {
    const btn = document.querySelector('.btn-screenshot');
    const originalText = btn.innerText;

    // 1. Hiển thị trạng thái đang xử lý
    btn.disabled = true;
    btn.innerText = "⏳ ĐANG CHỤP...";

    const captureArea = document.getElementById('capture-area');

    try {
        // 2. Sử dụng html2canvas để chụp (cấu hình scale 1.5 để cân bằng độ nét và dung lượng)
        const canvas = await html2canvas(captureArea, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff"
        });

        // 3. Chuyển canvas thành ảnh JPEG (nén tốt hơn PNG cho các vùng mờ/gradient)
        const image = canvas.toDataURL("image/jpeg", 0.85);
        const link = document.createElement('a');
        const dateStr = document.getElementById('date-text').innerText.replace(/\./g, '-');

        link.download = `HGPT-CHUYEN-CAN-${dateStr}.jpg`;
        link.href = image;
        link.click();

        // 4. Báo thành công
        btn.innerText = "✅ THÀNH CÔNG";
    } catch (error) {
        console.error("Lỗi khi chụp ảnh:", error);
        alert("Lỗi khi chụp ảnh Dashboard. Hãy thử lại!");
        btn.innerText = originalText;
    } finally {
        // 5. Khôi phục nút sau 2 giây
        setTimeout(() => {
            btn.disabled = false;
            btn.innerText = originalText;
        }, 2000);
    }
}
