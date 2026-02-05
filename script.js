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
    document.getElementById('display-date').innerText = `${day}.${month}.${year}`;
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
    const colors = ['#002d72', '#ced4da', '#ed1c24', '#f39c12'];
    const total = data.reduce((a, b) => a + b, 0);

    // Cập nhật Chú thích (Custom Legend)
    const legendContainer = document.getElementById('chart-legend');
    legendContainer.innerHTML = '';

    data.forEach((val, i) => {
        const percent = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <div class="legend-color" style="background: ${colors[i]}"></div>
            <span>${labels[i]}: <strong>${val}</strong> (${percent}%)</span>
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

function shuffleQuote() {
    if (quotes.length > 0) {
        const randomIdx = Math.floor(Math.random() * quotes.length);
        const q = quotes[randomIdx];

        document.getElementById('quote-line').innerText = q.main;
        document.getElementById('quote-sub').innerText = `"${q.sub}"`;

        const label = document.getElementById('v-label');
        const icon = document.getElementById('v-icon');
        const combinedText = (q.main + " " + q.sub).toLowerCase();

        // Hệ thống phân loại thông minh theo văn hóa HGPT và bộ 3 Giá trị cốt lõi
        const categories = [
            {
                keys: ['an toàn', 'safety', 'bảo hộ', 'về nhà'],
                label: "HGPT SAFETY",
                icon: "🛡️",
                color: "var(--hgpt-red)"
            },
            {
                keys: ['kỷ luật', 'quy trình', 'tác phong', 'đúng giờ'],
                label: "HGPT DISCIPLINE",
                icon: "⚖️",
                color: "#333"
            },
            {
                keys: ['nói sao làm vậy', 'tiến độ', 'chủng loại', 'thanh toán', 'chữ tín', 'chính xác'],
                label: "NÓI SAO LÀM VẬY",
                icon: "🤝",
                color: "var(--hgpt-blue)"
            },
            {
                keys: ['giải pháp tối ưu', 'thiết kế tối ưu', 'tiết kiệm', 'win - win', '5s', 'phối hợp'],
                label: "GIẢI PHÁP TỐI ƯU",
                icon: "💡",
                color: "var(--hgpt-brown)"
            },
            {
                keys: ['trách nhiệm đến cùng', 'không bỏ rơi', 'không đổ lỗi', 'bảo hành', 'tận tâm', 'đồng hành'],
                label: "TRÁCH NHIỆM ĐẾN CÙNG",
                icon: "🏆",
                color: "var(--hgpt-red)"
            },
            {
                keys: ['tết', 'năm mới', 'xuân', 'chúc mừng'],
                label: "HGPT CELEBRATIONS",
                icon: "🧧",
                color: "var(--hgpt-red)"
            }
        ];

        // Tìm category phù hợp nhất bằng cách quét cả tiêu đề và nội dung
        let found = categories.find(cat => cat.keys.some(key => combinedText.includes(key)));

        if (found) {
            label.innerText = found.label;
            icon.innerText = found.icon;
            label.style.color = found.color;
        } else {
            // Nếu không tìm thấy, tự động tạo nhãn HGPT + Tiêu đề ngắn gọn
            const shortTitle = q.main.split(' ')[0].toUpperCase();
            label.innerText = `HGPT ${shortTitle}`;
            icon.innerText = "✨";
            label.style.color = "var(--hgpt-brown)";
        }
    }
}

// Khởi chạy
initDate();
updateDashboard();
loadQuotes();

async function takeScreenshot() {
    const btn = document.querySelector('.btn-screenshot');
    const originalText = btn.innerText;

    // 1. Hiển thị trạng thái đang xử lý
    btn.disabled = true;
    btn.innerText = "⏳ ĐANG CHỤP...";

    const captureArea = document.getElementById('capture-area');

    try {
        // 2. Sử dụng html2canvas để chụp (cấu hình scale 2 cho ảnh sắc nét)
        const canvas = await html2canvas(captureArea, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff"
        });

        // 3. Chuyển canvas thành ảnh và tải về
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        const dateStr = document.getElementById('display-date').innerText.replace(/\./g, '-');

        link.download = `HGPT-CHUYEN-CAN-${dateStr}.png`;
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
