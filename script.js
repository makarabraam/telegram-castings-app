// Дождемся загрузки документа и Telegram WebApp API
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram WebApp
    const tg = window.Telegram.WebApp;
    
    // Адаптируем цвета приложения к теме Telegram
    document.body.style.backgroundColor = tg.backgroundColor || '#121212';
    
    // Показываем главное окно приложения
    tg.expand(); // Разворачиваем приложение на весь экран
    tg.ready(); // Сообщаем Telegram, что приложение готово

    // ID вашей Google таблицы (замените на ваш ID таблицы)
    const sheetID = '19wr2WujBRRtXHRwsWdy3gfOxMQ9mlhckjhyewPBt0Vs';
    // URL для доступа к опубликованной таблице в формате CSV
    const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetID}/export?format=csv`;
    
    // Получаем элементы DOM для работы с ними
    const citySelector = document.getElementById('citySelector');
    const castingsList = document.getElementById('castingsList');
    const headerElement = document.getElementById('header');
    const loaderElement = document.getElementById('loader');
    const backButton = document.getElementById('backButton');
    const backButtonContainer = document.getElementById('backButtonContainer');
    
    // Глобальная переменная для хранения всех кастингов
    let allCastings = [];
    
    // Загружаем данные из таблицы при загрузке страницы
    loadData();
    
    // Функция для загрузки данных
    function loadData() {
        // Показываем индикатор загрузки
        citySelector.style.display = 'none';
        loaderElement.style.display = 'flex';
        
        // Загружаем данные из Google Таблицы
        fetchCastingsData();
    }
    
    // Обработчик нажатия на кнопку "Назад"
    backButton.addEventListener('click', function() {
        // Возвращаемся к выбору города
        castingsList.style.display = 'none';
        backButtonContainer.style.display = 'none';
        citySelector.style.display = 'flex';
        headerElement.textContent = 'Выберите ваш город';
    });
    
    // Функция для загрузки данных из Google Таблицы
    function fetchCastingsData() {
        fetch(sheetURL)
            .then(response => {
                // Проверяем успешность запроса
                if (!response.ok) {
                    throw new Error('Не удалось загрузить данные');
                }
                return response.text();
            })
            .then(csv => {
                // Обрабатываем полученные данные CSV
                allCastings = parseCSV(csv);
                displayCitySelector(getUniqueCities(allCastings));
            })
            .catch(error => {
                // Обрабатываем ошибки
                console.error('Ошибка при загрузке данных:', error);
                alert('Не удалось загрузить данные кастингов. Пожалуйста, попробуйте позже.');
                loaderElement.style.display = 'none';
            });
    }
    
    // Функция для парсинга CSV данных
    function parseCSV(csv) {
        // Разбиваем CSV на строки
        const lines = csv.split('\n');
        // Первая строка содержит заголовки
        const headers = lines[0].split(',');
        
        // Находим индексы нужных нам столбцов
        const nameIndex = headers.findIndex(h => h.trim().toLowerCase() === 'название');
        const cityIndex = headers.findIndex(h => h.trim().toLowerCase() === 'город');
        const dateTimeIndex = headers.findIndex(h => h.trim().toLowerCase() === 'дата и время');
        
        // Проверяем, что все нужные столбцы найдены
        if (nameIndex === -1 || cityIndex === -1 || dateTimeIndex === -1) {
            throw new Error('В таблице не найдены необходимые столбцы');
        }
        
        // Создаем массив для хранения данных о кастингах
        const castings = [];
        
        // Обрабатываем каждую строку, начиная со второй (индекс 1)
        for (let i = 1; i < lines.length; i++) {
            // Пропускаем пустые строки
            if (!lines[i].trim()) continue;
            
            // Разбиваем строку на значения, учитывая возможное наличие запятых внутри кавычек
            let values = parseCsvLine(lines[i]);
            
            // Проверяем, что строка содержит достаточно значений
            if (values.length > Math.max(nameIndex, cityIndex, dateTimeIndex)) {
                // Создаем объект с данными о кастинге
                castings.push({
                    name: values[nameIndex].trim(),
                    city: values[cityIndex].trim(),
                    dateTime: values[dateTimeIndex].trim(),
                    date: parseDateTime(values[dateTimeIndex].trim())
                });
            }
        }
        
        return castings;
    }
    
    // Вспомогательная функция для корректного разбиения CSV строки с учетом запятых в кавычках
    function parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }
            
            if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
                continue;
            }
            
            current += char;
        }
        
        if (current) {
            result.push(current);
        }
        
        return result;
    }
    
    // Функция для парсинга строки даты и времени в объект Date
    function parseDateTime(dateTimeString) {
        // Удаляем возможные лишние пробелы
        dateTimeString = dateTimeString.trim();
        
        // Создаем регулярное выражение для разбора различных форматов даты
        // Например: "27.05.2025 12:00" или "27/05/2025 12:00" или "2025-05-27 12:00"
        const match = dateTimeString.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s+(\d{1,2}):(\d{2})/);
        
        if (match) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1; // Месяцы в JS начинаются с 0
            const year = parseInt(match[3], 10);
            const hours = parseInt(match[4], 10);
            const minutes = parseInt(match[5], 10);
            
            return new Date(year, month, day, hours, minutes);
        }
        
        // Если формат не распознан, возвращаем текущую дату
        // (этот кастинг будет отфильтрован позже)
        return new Date();
    }
    
    // Функция для форматирования даты в нужный формат
    function formatDateTime(date) {
        const day = date.getDate();
        
        // Массив названий месяцев в родительном падеже
        const monthNames = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        
        const month = monthNames[date.getMonth()];
        
        // Форматируем часы и минуты
        let hours = date.getHours();
        let minutes = date.getMinutes();
        
        // Добавляем ведущий ноль, если нужно
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        return `${day} ${month} ${hours}:${minutes}`;
    }
    
    // Функция для получения списка уникальных городов
    function getUniqueCities(castings) {
        const cities = new Set();
        
        castings.forEach(casting => {
            if (casting.city) {
                cities.add(casting.city);
            }
        });
        
        return Array.from(cities).sort();
    }
    
    // Функция для отображения выбора города
    function displayCitySelector(cities) {
        // Скрываем индикатор загрузки
        loaderElement.style.display = 'none';
        
        // Проверяем, есть ли города
        if (cities.length === 0) {
            citySelector.innerHTML = '<p class="no-cities">Нет доступных городов</p>';
            citySelector.style.display = 'block';
            return;
        }
        
        // Очищаем селектор перед добавлением новых кнопок
        citySelector.innerHTML = '';
        
        // Создаем и добавляем кнопки для каждого города
        cities.forEach(city => {
            const button = document.createElement('button');
            button.className = 'city-button';
            button.textContent = city;
            
            // Добавляем обработчик нажатия на кнопку города
            button.addEventListener('click', function() {
                const selectedCity = this.textContent;
                showCastingsForCity(selectedCity);
            });
            
            citySelector.appendChild(button);
        });
        
        // Показываем селектор городов
        citySelector.style.display = 'flex';
    }
    
    // Функция для отображения кастингов для выбранного города
    function showCastingsForCity(city) {
        // Скрываем селектор городов
        citySelector.style.display = 'none';
        
        // Показываем индикатор загрузки
        loaderElement.style.display = 'flex';
        
        // Фильтруем кастинги по выбранному городу и отображаем их
        setTimeout(() => {
            // Получаем текущую дату и время
            const now = new Date();
            
            // Добавляем 2 часа к текущему времени
            const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
            
            // Фильтруем кастинги по городу и дате (не показываем те, до которых осталось менее 2 часов)
            const filteredCastings = allCastings.filter(casting => 
                casting.city === city && casting.date > twoHoursFromNow
            );
            
            // Сортируем кастинги по дате и времени (от ближайших к будущим)
            filteredCastings.sort((a, b) => a.date - b.date);
            
            // Отображаем отфильтрованные кастинги
            displayCastings(filteredCastings, city);
        }, 300); // Небольшая задержка для анимации
    }
    
    // Функция для отображения кастингов на странице
    function displayCastings(castings, city) {
        // Скрываем индикатор загрузки
        loaderElement.style.display = 'none';
        
        // Обновляем заголовок
        headerElement.textContent = `Список ближайших кастингов в ${city}`;
        
        // Проверяем, есть ли кастинги
        if (castings.length === 0) {
            castingsList.innerHTML = '<p class="no-castings">Нет доступных кастингов в ближайшее время</p>';
            castingsList.style.display = 'block';
            backButtonContainer.style.display = 'flex';
            return;
        }
        
        // Очищаем список перед добавлением новых карточек
        castingsList.innerHTML = '';
        
        // Создаем и добавляем карточки для каждого кастинга
        castings.forEach(casting => {
            const card = document.createElement('div');
            card.className = 'casting-card';
            
            const title = document.createElement('div');
            title.className = 'casting-title';
            title.textContent = casting.name;
            
            const dateTime = document.createElement('div');
            dateTime.className = 'casting-datetime';
            dateTime.textContent = formatDateTime(casting.date);
            
            card.appendChild(title);
            card.appendChild(dateTime);
            
            castingsList.appendChild(card);
        });
        
        // Показываем список кастингов и кнопку "Назад"
        castingsList.style.display = 'block';
        backButtonContainer.style.display = 'flex';
    }
});
