// Дождемся загрузки документа и Telegram WebApp API
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram WebApp
    const tg = window.Telegram.WebApp;
    
    // Адаптируем цвета приложения к теме Telegram
    document.body.style.backgroundColor = tg.backgroundColor || '#ffffff';
    
    // Показываем главное окно приложения
    tg.expand(); // Разворачиваем приложение на весь экран
    tg.ready(); // Сообщаем Telegram, что приложение готово

    // ID вашей Google таблицы (замените на ваш ID таблицы)
    const sheetID = '19wr2WujBRRtXHRwsWdy3gfOxMQ9mlhckjhyewPBt0Vs';
    // URL для доступа к опубликованной таблице в формате CSV
    const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetID}/export?format=csv`;
    
    // Получаем элементы DOM для работы с ними
    const startButton = document.getElementById('startButton');
    const castingsList = document.getElementById('castingsList');
    const headerElement = document.getElementById('header');
    const loaderElement = document.getElementById('loader');
    
    // Обработчик нажатия на кнопку "Старт"
    startButton.addEventListener('click', function() {
        // Показываем индикатор загрузки
        startButton.style.display = 'none';
        loaderElement.style.display = 'flex';
        
        // Загружаем данные из таблицы
        fetchCastingsData();
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
                const castings = parseCSV(csv);
                displayCastings(castings);
            })
            .catch(error => {
                // Обрабатываем ошибки
                console.error('Ошибка при загрузке данных:', error);
                alert('Не удалось загрузить данные кастингов. Пожалуйста, попробуйте позже.');
                startButton.style.display = 'block';
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
            
            // Разбиваем строку на значения
            const values = lines[i].split(',');
            
            // Проверяем, что строка содержит достаточно значений
            if (values.length > Math.max(nameIndex, cityIndex, dateTimeIndex)) {
                castings.push({
                    name: values[nameIndex].trim(),
                    city: values[cityIndex].trim(),
                    dateTime: values[dateTimeIndex].trim()
                });
            }
        }
        
        return castings;
    }
    
    // Функция для отображения кастингов на странице
    function displayCastings(castings) {
        // Скрываем индикатор загрузки
        loaderElement.style.display = 'none';
        
        // Проверяем, есть ли кастинги
        if (castings.length === 0) {
            castingsList.innerHTML = '<p class="no-castings">Нет доступных кастингов</p>';
            castingsList.style.display = 'block';
            return;
        }
        
        // Обновляем заголовок, используя город из первого кастинга
        const cityName = castings[0].city;
        headerElement.textContent = `Список ближайших кастингов в ${cityName}`;
        
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
            dateTime.textContent = casting.dateTime;
            
            card.appendChild(title);
            card.appendChild(dateTime);
            
            castingsList.appendChild(card);
        });
        
        // Показываем список кастингов
        castingsList.style.display = 'block';
    }
});