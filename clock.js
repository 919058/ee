// Time Zone Configurations
const timeZones = [
    { name: 'New York', timezone: 'America/New_York', color: '#FF6B6B' },
    { name: 'London', timezone: 'Europe/London', color: '#4ECDC4' },
    { name: 'Paris', timezone: 'Europe/Paris', color: '#FFE66D' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo', color: '#95E1D3' },
    { name: 'Sydney', timezone: 'Australia/Sydney', color: '#F38181' },
    { name: 'Dubai', timezone: 'Asia/Dubai', color: '#AA96DA' },
    { name: 'Singapore', timezone: 'Asia/Singapore', color: '#FCBAD3' },
    { name: 'Hong Kong', timezone: 'Asia/Hong_Kong', color: '#A8D8EA' },
    { name: 'Los Angeles', timezone: 'America/Los_Angeles', color: '#FF8B94' },
    { name: 'Mexico City', timezone: 'America/Mexico_City', color: '#FFB7B2' },
    { name: 'São Paulo', timezone: 'America/Sao_Paulo', color: '#FFDAC1' },
    { name: 'Mumbai', timezone: 'Asia/Kolkata', color: '#E2F0CB' }
];

let selectedTimezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];

// Initialize the page
function init() {
    createTimezoneSelector();
    createClocks();
    updateAllClocks();
    setInterval(updateAllClocks, 1000);
}

// Create timezone selector buttons
function createTimezoneSelector() {
    const selector = document.getElementById('timezoneSelector');
    selector.innerHTML = '';
    
    timeZones.forEach(tz => {
        const btn = document.createElement('button');
        btn.className = 'timezone-btn';
        if (selectedTimezones.includes(tz.timezone)) {
            btn.classList.add('active');
        }
        btn.textContent = tz.name;
        btn.onclick = () => toggleTimezone(tz.timezone, btn);
        selector.appendChild(btn);
    });
}

// Toggle timezone selection
function toggleTimezone(timezone, btn) {
    const index = selectedTimezones.indexOf(timezone);
    if (index > -1) {
        selectedTimezones.splice(index, 1);
        btn.classList.remove('active');
    } else {
        selectedTimezones.push(timezone);
        btn.classList.add('active');
    }
    
    createClocks();
    updateAllClocks();
}

// Create clock cards
function createClocks() {
    const grid = document.getElementById('clocksGrid');
    grid.innerHTML = '';
    
    const sortedTimezones = timeZones.filter(tz => selectedTimezones.includes(tz.timezone));
    
    sortedTimezones.forEach(tz => {
        const card = document.createElement('div');
        card.className = 'clock-card';
        card.innerHTML = `
            <div class="timezone-name">${tz.name}</div>
            <div class="digital-display">
                <div class="time" id="time-${tz.timezone}">--:--:--</div>
                <div class="meridiem" id="meridiem-${tz.timezone}">--</div>
                <div class="date" id="date-${tz.timezone}">---</div>
            </div>
            <div class="analog-clock">
                <div class="clock-numbers" id="numbers-${tz.timezone}"></div>
                <div class="hand hour-hand" id="hour-${tz.timezone}"></div>
                <div class="hand minute-hand" id="minute-${tz.timezone}"></div>
                <div class="hand second-hand" id="second-${tz.timezone}"></div>
                <div class="clock-center"></div>
            </div>
            <div class="offset" id="offset-${tz.timezone}">UTC Offset: --</div>
        `;
        grid.appendChild(card);
        
        // Initialize clock numbers
        initClockNumbers(tz.timezone);
    });
}

// Initialize clock face numbers
function initClockNumbers(timezone) {
    const numbersContainer = document.getElementById(`numbers-${timezone}`);
    for (let i = 1; i <= 12; i++) {
        const number = document.createElement('div');
        number.className = 'clock-number';
        number.textContent = i;
        number.style.transform = `rotate(${i * 30}deg) translateY(-65px)`;
        number.style.transform += ` rotate(-${i * 30}deg)`;
        numbersContainer.appendChild(number);
    }
}

// Format time with leading zeros
function formatTime(num) {
    return num < 10 ? '0' + num : num;
}

// Get UTC offset string
function getUTCOffset(date) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const utcDate = new Date(formatter.format(date).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6Z'));
    const offset = date - utcDate;
    const hours = Math.floor(Math.abs(offset) / 3600000);
    const minutes = Math.floor((Math.abs(offset) % 3600000) / 60000);
    const sign = offset >= 0 ? '+' : '-';
    
    return `UTC ${sign}${formatTime(hours)}:${formatTime(minutes)}`;
}

// Update all clocks
function updateAllClocks() {
    selectedTimezones.forEach(timezone => {
        updateClock(timezone);
    });
}

// Update individual clock
function updateClock(timezone) {
    const now = new Date();
    
    // Get time in specific timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    const parts = formatter.formatToParts(now);
    const timeParts = {};
    
    parts.forEach(part => {
        timeParts[part.type] = part.value;
    });
    
    const hours = parseInt(timeParts.hour);
    const minutes = parseInt(timeParts.minute);
    const seconds = parseInt(timeParts.second);
    const meridiem = timeParts.dayPeriod;
    
    // Update digital display
    const timeDisplay = document.getElementById(`time-${timezone}`);
    if (timeDisplay) {
        timeDisplay.textContent = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
    }
    
    const meridiemDisplay = document.getElementById(`meridiem-${timezone}`);
    if (meridiemDisplay) {
        meridiemDisplay.textContent = meridiem;
    }
    
    // Update date
    const dateDisplay = document.getElementById(`date-${timezone}`);
    if (dateDisplay) {
        const dateOptions = { 
            timeZone: timezone,
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        const dateFormatter = new Intl.DateTimeFormat('en-US', dateOptions);
        dateDisplay.textContent = dateFormatter.format(now);
    }
    
    // Update offset
    const offsetDisplay = document.getElementById(`offset-${timezone}`);
    if (offsetDisplay) {
        offsetDisplay.textContent = getUTCOffset(now, timezone);
    }
    
    // Update analog clock hands
    updateAnalogClock(timezone, hours, minutes, seconds);
}

// Update analog clock hands
function updateAnalogClock(timezone, hours, minutes, seconds) {
    // Convert to 12-hour format for analog display
    const displayHours = hours % 12;
    
    // Hour hand: 360 / 12 hours = 30 degrees per hour
    const hourDegrees = (displayHours * 30) + (minutes * 0.5);
    const hourHand = document.getElementById(`hour-${timezone}`);
    if (hourHand) {
        hourHand.style.transform = `rotate(${hourDegrees}deg)`;
    }
    
    // Minute hand: 360 / 60 minutes = 6 degrees per minute
    const minuteDegrees = (minutes * 6) + (seconds * 0.1);
    const minuteHand = document.getElementById(`minute-${timezone}`);
    if (minuteHand) {
        minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
    }
    
    // Second hand: 360 / 60 seconds = 6 degrees per second
    const secondDegrees = seconds * 6;
    const secondHand = document.getElementById(`second-${timezone}`);
    if (secondHand) {
        secondHand.style.transform = `rotate(${secondDegrees}deg)`;
    }
}

// Start the clock
window.addEventListener('DOMContentLoaded', init);
