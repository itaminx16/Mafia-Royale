(function () {
  const I18N_DICT = {
    ua: {
      // Auth & Branding
      logo_bottom_line: 'МАФІЯ: КЛУБ ОНЛАЙН • ГРА ПОЧИНАЄТЬСЯ',
      auth_choose_lang: 'Мова / Language:',
      auth_tab_login: '🔑 Вхід',
      auth_tab_reg: '✨ Новий гравець',
      auth_tab_email: '✉️ E-mail / Google',
      auth_tab_guest: '🎭 Гість',
      auth_email_create_lbl: 'Створити новий акаунт по E-mail',
      ph_email: 'Ваш E-mail (example@gmail.com)...',
      ph_nickname: 'Введи свій нікнейм...',
      ph_password: 'Введи пароль (мін. 4 символи)...',
      auth_reg_gender: 'Обери стать персонажа:',
      gender_male: '👨 Чоловік',
      gender_female: '👩 Жінка',
      gender_other: '🎭 Інше',
      ph_ref_code: 'Нік друга, який запросив (+500 🪙 бонус, необов\'язково)',
      auth_login_btn: 'Увійти в гру',
      cookie_banner_text: '🍪 Ми використовуємо localStorage та файли cookie для збереження вашої сесії та налаштувань (GDPR).',
      cookie_accept_btn: 'Прийняти',

      // Main Menu
      happy_hour_banner: '🔥 ЩАСЛИВІ ГОДИНИ (Київ): Зараз x2 Досвід та Монети за кожну гру!',
      title_avatar_zoom: 'Натисни, щоб збільшити фото',
      title_badge_details: 'Натисни для деталей',
      stat_level_lbl: 'Рівень ',
      stat_auth_lbl: 'Авторитет ',
      stat_coins_lbl: 'Монети ',
      stat_diamonds_lbl: 'Діаманти ',
      menu_join_quick: 'Приєднатися',
      menu_join_sub: 'Знайти відкритий стіл',
      menu_create_quick: 'Створити кімнату',
      menu_create_sub: 'Налаштувати свій матч',
      menu_mod: '🛠️ Адмін та Мод-панель',
      tile_friends: 'Друзі/Сім\'я',
      tile_shop: 'Крамниця',
      tile_quests: 'Завдання',
      tile_global: 'Заг. чат',
      tile_top: 'Топ-100',
      tile_rules: 'Правила',
      tile_profile: 'Профіль',
      tile_settings: 'Налашт.',
      menu_dev: '📰 Новини',
      menu_author: '👨‍💻 Автор',
      menu_ideas: '💌 Ідеї',
      menu_install_app: '📲 Встановити додаток (Телефон / ПК)',
      mod_export_db: '💾 Скачати резервну копію БД (.json)',
      mod_import_db: '📂 Відновити БД з файлу (.json)',

      // Common Buttons
      btn_back_menu: '← Назад у меню',
      btn_back: '← Назад',
      btn_close: 'Закрити',
      btn_save: 'Зберегти',
      btn_cancel: 'Скасувати',
      btn_confirm: 'Підтвердити',
      btn_exit: '🚪 Вийти',
      btn_send_title: 'Надіслати (Enter)',

      // Mod Panel
      mod_refresh: '🔄 Оновити',
      mod_title: '🛠️ Адмін та Мод-панель',
      mod_sec_dash: '📊 Живий дашборд проєкту',
      mod_online_hint: '👥 Гравці онлайн (клік — підставити нік):',
      mod_sec_bots: '🤖 Керування ботами та фазою (поточна кімната)',
      mod_add4: '+4 Боти',
      mod_add8: '+8 Ботів',
      mod_clear_bots: '✕ Очистити',
      mod_skip_phase: '⏩ Пропустити таймер фази (до 1 сек)',
      mod_bot_style_lbl: 'Стиль поведінки ботів:',
      mod_bot_style_bal: 'Збалансовані (розумна гра)',
      mod_bot_style_agg: 'Агресивні (активно звинувачують)',
      mod_bot_style_caut: 'Обережні (тиха гра)',
      mod_bot_order_title: 'Наказ конкретному боту:',
      ph_mod_bot_nick: 'Нік бота (напр. Бот_Алекс)',
      ph_mod_bot_say: 'Текст для чату...',
      mod_bot_say_btn: '💬 Сказати',
      ph_mod_bot_vote: 'Ціль для голосу...',
      mod_bot_vote_btn: '🗳️ Голос',
      mod_sec_reports: '🚩 Скарги гравців',
      mod_rep_open: '🔴 Відкриті',
      mod_rep_closed: '🟢 Закриті',
      mod_rep_all: '📋 Усі',
      ph_mod_rep_search: '🔍 Пошук скарги за ніком або причиною...',
      mod_sec_punish: '🔨 Покарання та їх скасування',
      ph_player_nick: 'Нікнейм гравця...',
      pun_warn: '⚠️ Попередження (-10 карми)',
      pun_m30: '🔇 Мут чату на 30 хвилин',
      pun_m2h: '🔇 Мут чату на 2 години',
      pun_m24h: '🔇 Мут чату на 24 години',
      pun_pb24h: '🎮 Заборона грати на 24 години (чати доступні)',
      pun_pb7d: '🎮 Заборона грати на 7 днів (чати доступні)',
      pun_pbperm: '🎮 Заборона грати назавжди (чати доступні)',
      pun_tb24h: '⏳ Тимчасовий бан на 24 години',
      pun_tb7d: '⏳ Тимчасовий бан на 7 днів',
      pun_permban: '🚫 Перманентний бан назавжди',
      ph_pun_reason: 'Причина покарання (необов\'язково)...',
      mod_apply_punish: '⚖️ Застосувати покарання',
      mod_unmute: '🔊 Зняти мут',
      mod_unplayban: '🎮 Зняти заборону гри',
      mod_unban: '🔓 Розбанити',
      mod_active_puns: '📋 Активні мути, заборони гри та бани:',
      mod_sec_gift: '🎁 Нарахувати нагороду гравцю',
      lbl_coins: 'Монети 🪙',
      lbl_diamonds: 'Діаманти 💎',
      lbl_auth: 'Авторитет ⭐',
      lbl_xp: 'Досвід XP',
      ph_mod_gift_comment: 'Коментар від адміна (напр. За чудову гру!)',
      mod_grant_btn: '🎁 Нарахувати нагороду',
      mod_sec_anticheat: '🕵️ Підозрілі дії (Античит)',
      mod_ac_hint: 'Автоматично зафіксовані спроби читерства / спаму:',
      mod_clear_btn: '🧹 Очистити',
      mod_sec_ideas: '💡 Ідеї та відгуки гравців',
      mod_sec_news: '📰 Публікація новин розробки',
      ph_post_title: 'Заголовок новини...',
      ph_post_text: 'Текст оновлення або патчноуту...',
      mod_pub_post: '📢 Опублікувати для всіх',
      mod_sec_logs: '📜 Журнал дій модераторів',

      // Quests & Profile
      quests_title: '🎯 Щоденні завдання',
      profile_stats_title: '📊 Статистика гравця',
      profile_history_title: '📜 Історія ігор',
      profile_no_history: 'Поки що немає зіграних матчів.',

      // Play / Create Room
      play_create_room: '➕ Створити свою кімнату',
      play_new_room_title: 'Налаштування нової кімнати',
      ph_room_name: 'Назва кімнати',
      mode_classic_opt: 'Режим: Класика',
      mode_legend_opt: 'Режим: Легенда (від 100 ігор)',
      room_is_ranked: ' 🏆 Рангова (Анти-тімінг)',
      room_is_private: ' 🔒 Приватна (з паролем)',
      ph_room_pass: 'Пароль для приватної кімнати...',
      room_min_p: 'Мінімум гравців:',
      room_max_p: 'Максимум гравців:',
      room_min_auth: 'Мінімальний авторитет входу:',
      room_pick_roles: 'Обери ролі для кімнати:',
      room_submit_btn: '🟢 Створити кімнату та увійти в лобі',
      play_active_rooms: 'Активні та поточні кімнати',
      play_no_rooms: 'Немає створених кімнат. Будь першим!',

      // Lobby & Room
      lobby_default_title: 'Лобі кімнати',
      btn_invite: '🔗 Запросити',
      btn_mod_short: '🛠️ Мод',
      lobby_waiting: '⏳ Очікування гравців...',
      tag_classic: 'КЛАСИКА',
      lobby_roles_summary: '🎭 Ролі в цій кімнаті',
      lobby_players_lbl: 'Гравці в лобі',
      lobby_minigames_btn: '🎮 Міні-ігри поки чекаємо',
      lobby_start_btn: '▶️ Почати гру зараз',
      lobby_chat_title: '💬 ЧАТ ЛОБІ (Окремо від гри)',
      ph_lobby_msg: 'Спілкування в лобі... (Enter для відправки)',
      title_send_lobby: 'Надіслати в лобі',
      room_default_title: 'Кімната',
      my_role_pill_default: '🎭 Роль',
      title_role_pill: 'Натисніть, щоб переглянути опис ролі',
      dead_free_play_text: '👻 Ви вибули з цієї партії — можна спостерігати або вільно створити/увійти в іншу гру без штрафу.',
      dead_free_play_btn: '🎮 Інші кімнати',
      room_last_will: '📜 Останнє слово:',
      ph_last_will: 'Напишіть ваше останнє слово для міста...',
      room_last_will_btn: 'Надіслати',
      room_players: '👥 Гравці',
      room_click_mention: '• клік по ніку = згадати в чаті',
      channel_day_default: '☀️ ДЕННЕ ОБГОВОРЕННЯ',
      react_suspicion: 'Підозрюю',
      react_quiet: 'Тихо',
      react_mafia: 'Мафія?',
      react_dead: 'Смерть',
      react_agree: 'Згоден',
      react_disagree: 'Проти',
      react_shock: 'Шок',
      react_question: 'Питання',
      react_candle: 'Свічка',
      react_mask: 'Маска',
      react_cheers: 'За успіх',
      room_gift_target_lbl: 'Кому подарувати:',
      room_gift_incognito: '🕵️ Інкогніто (+15 🪙 або безкоштовно з VIP)',
      title_emoji_btn: 'Смайли',
      title_gift_btn: 'Подарувати предмет за стіл',
      ph_room_msg: 'Написати повідомлення... (Enter для відправки)',
      title_send_msg: 'Надіслати повідомлення (Enter)',
      room_roles_list: '🎭 Список ролей у кімнаті',
      btn_share_match: '📸 Картка матчу для соцмереж',

      // Friends & Private Chat
      friends_title: '👥 Друзі, Пошук та Сім\'я',
      tab_friends: '🔍 Пошук і Друзі',
      tab_reqs: '📩 Заявки',
      tab_family: '⚜️ Сім\'я',
      friends_search_lbl: 'Знайти гравця за нікнеймом (або залиш порожнім для списку):',
      ph_search_player: 'Введи нікнейм гравця...',
      btn_search: '🔍 Знайти',
      ref_title: '🎁 Реферальне посилання (Приведи друга):',
      ref_desc: '1 друг = +500 🪙 і стікери; 3 друзі = Рамка + VIP 3 дні; 5 друзів = Титул «Хрещений батько».',
      ref_copy_btn: '📋 Скопіювати моє реферальне посилання',
      friends_my_hdr: 'Мої друзі:',
      friends_empty: 'Список друзів порожній.',
      friends_no_reqs: 'Вхідних заявок у друзі немає.',
      pm_back_friends: '← До списку друзів',
      pm_default_title: '✉️ Чат з гравцем',
      ph_pm_msg: 'Написати особисте повідомлення... (Enter для відправки)',

      // Shop & Donate
      shop_title: '🛒 Крамниця, Донат та Кастомізація',
      shop_cat_all: 'Усе',
      shop_cat_gift: '🎁 Подарунки',
      shop_cat_frame: '🖼️ Рамки',
      shop_cat_death_fx: '💥 Ефекти',
      shop_cat_premium: '👑 VIP / Буст',
      shop_cat_exchange: '💎 Обмін 💎→🪙',
      shop_cat_donate: '💳 Підтримка / Донат',

      // Rules
      rules_title: '📖 Правила гри та Ролі',
      rules_how_to_html:
        '<b>Як проходить гра:</b><br>' +
        '• <b>Ніч (Чат Мафії — 30 с):</b> Мафія домовляється у таємному чаті (а Медіум підслуховує їх інкогніто).<br>' +
        '• <b>Ніч (Вибір цілей — 30 с):</b> Активні ролі обирають ціль.<br>' +
        '• <b>День (Обговорення — 60 с):</b> Усі живі гравці обговорюють події ночі.<br>' +
        '• <b>День (Голосування — 30 с):</b> Місто голосує за вигнання підозрюваного.',
      rules_teams_title: '⚖️ Команди, Карма та Авторитет (натисніть трикутник ▾):',
      rules_town_sum: '🏙️ Команда Мирних',
      rules_town_html: 'Головна мета — знайти на денному голосуванні та усунути <b>всю Мафію і Культ</b>. Мирні перемагають лише тоді, коли в живих не залишилось жодного гравця Мафії чи Культу.',
      rules_mafia_sum: '🔫 Команда Мафії',
      rules_mafia_html: 'Вночі домовляється в таємному чаті та вбиває ціль. Перемагає <b>лише тоді, коли всі Мирні та Культ повністю знищені</b>!',
      rules_cult_sum: '🕯️ Культ',
      rules_cult_html: 'Лідер Культу щоночі вербує одного мирного гравця у свою секту. Культ перемагає, коли Мафії вже немає і культистів більшість, або коли всі вороги вибули.',
      rules_neutral_sum: '🃏 Нейтрали (Джокер, Амнезіак, Янгол)',
      rules_neutral_html: 'У кожного нейтрала власна мета: <b>Джокер</b> виграє миттєво, якщо його стратять на денному голосуванні; <b>Амнезіак</b> після першої смерті переймає роль вибулого; <b>Янгол-Охоронець</b> перемагає з містом або якщо доживе до фіналу.',
      rules_karma_sum: '🛡️ Карма (Порядність) та ⭐ Авторитет',
      rules_karma_html: '<b>Карма (0–100):</b> падає на -12 за вихід живим із матчу та -10 за мут/попередження; при &lt;50 закрито вхід у кімнати вищого рівня. Відновлюється (+2) за кожну дограну партію.<br><b>Авторитет:</b> росте за перемоги, відкриває кімнати з порогом авторитету та формує Топ-100.',
      rules_roles_hdr: '🎭 Опис усіх ролей:',

      // Global & Top
      global_title: '🌍 Загальний чат',
      ph_global_msg: 'Повідомлення у загальний чат... (Enter для відправки)',
      top_title: '🏆 Топ-100 гравців',
      top_all_btn: 'За весь час',
      top_today_btn: 'За сьогодні',

      // Settings
      settings_title: '⚙️ Налаштування',
      settings_show_badge: 'Показувати значок 100 біля ніку',
      settings_audio_grp: '🔊 Звуковий супровід',
      settings_sfx_toggle: 'Звукові ефекти інтерфейсу та подій',
      settings_vol_lbl: 'Гучність звуків:',
      settings_chat_grp: '💬 Чат та читабельність',
      settings_font_lbl: 'Розмір шрифту (чат та інтерфейс):',
      font_opt_11: 'Малий (11px) — компактний',
      font_opt_13: 'Стандартний (13px)',
      font_opt_15: 'Великий (15px) — зручний для очей',
      font_opt_17: 'Дуже великий (17px)',
      font_preview_html: '👁️ Попередній перегляд тексту: <b>Шериф перевіряє підозрюваного вночі.</b>',
      settings_chat_style_lbl: 'Стиль бульбашок повідомлень:',
      style_opt_bubbles: 'Сучасні неонові бабли (закруглені)',
      style_opt_classic: 'Класичні компактні лінії',
      settings_tr_lang_lbl: '🌐 Мова перекладу СМС (в 1 клік):',
      settings_anim_grp: '✨ Інтерфейс та анімації',
      settings_anim_toggle: 'Плавні анімації та підсвічування',
      settings_profanity_title: '🛡️ Фільтр нецензурних слів',
      settings_profanity_toggle: 'Ввімкнути приховування лайки (***)',
      settings_profanity_words: 'Ваші заборонені слова (через кому):',
      ph_custom_words: 'слово1, слово2...',
      settings_profanity_save: '💾 Зберегти',
      settings_nick_lbl: 'Змінити нікнейм (доступно 1 раз за весь час):',
      ph_new_nick: 'Новий нікнейм...',
      settings_logo_lbl: 'Дизайн логотипа гри:',
      logo_gold: '👑 Хрещений Батько (Золотий металік)',
      logo_ruby: '♦️ Синдикат (Рубін і Сталь)',
      logo_emerald: '🐍 Тінь Ночі (Смарагдовий неон)',
      settings_lang: 'Мова інтерфейсу:',
      btn_logout: '🚪 Вийти з акаунту',
      btn_gdpr_del: '🗑️ Видалити акаунт та всі дані (GDPR)',

      // Dev Screen
      dev_news_title: '📰 Новини розробки гри',
      dev_email_hdr: 'Зв\'язок з розробником на E-mail',
      dev_email_addr: 'Пошта розробника: itaminx16@gmail.com',
      ph_email_subj: 'Тема звернення...',
      ph_email_body: 'Текст повідомлення...',
      dev_email_send: '✉️ Надіслати на itaminx16@gmail.com',

      // Modals
      dev_modal_title: '🔐 Перевірка розробника',
      ph_secret_code: 'Секретний код...',
      zoom_avatar_hint: 'Натисни на фото ще раз, щоб змінити аватар, стать або опис',
      edit_prof_title: '✏️ Редагування профілю',
      edit_upload_photo: 'Або завантаж нове фото з пристрою:',
      edit_gender_lbl: 'Стать:',
      edit_bio_lbl: 'Опис профілю:',
      badge_modal_default: '🏅 Значок 100',
      badge_show_toggle: 'Відображати значок біля ніку',
      btn_got_it: 'Зрозуміло',
      pub_prof_default: 'Гравець',
      pub_add_friend: '➕ Додати в друзі',
      pub_remove_friend: '✕ Видалити з друзів',
      pub_send_sms: '✉️ Написати СМС',
      pub_report: '🚩 Поскаржитись на гравця',
      room_players_modal_title: '👥 Гравці в кімнаті',
      match_card_title: '📸 Картка результатів матчу',
      match_card_save: '💾 Зберегти / Поділитися',
      rep_modal_title: '🚩 Подати скаргу на гравця',
      rep_offender_lbl: 'Порушник:',
      rep_cat_lbl: 'Категорія порушення:',
      rep_cat_insults: '🤬 Образи та нецензурна лексика',
      rep_cat_gamethrow: '🎭 Злив ролей / Гра не за свою команду',
      rep_cat_spam: '📢 Спам або флуд у чаті',
      rep_cat_blackmail: '⚠️ Шантаж або токсична поведінка',
      rep_cat_other: '📝 Інше порушення',
      rep_details_lbl: 'Уточнення або деталі скарги:',
      ph_rep_details: 'Опишіть ситуацію...',
      rep_ss_lbl: 'Додати скріншот (завантажте або вставте Ctrl+V):',
      rep_ss_remove: '✕ Прибрати скріншот',
      rep_auto_ctx: '💡 Останні 12 повідомлень з чату від вас та порушника додадуться автоматично для перевірки модератором.',
      rep_submit_btn: 'Надіслати скаргу',
      reward_title: 'Вам нараховано нагороду!',
      reward_claim_btn: 'Чудово! Забрати нагороду 🚀',
      ss_view_title: '🖼️ Перегляд скріншота скарги',
      role_reveal_hdr: 'Ваша роль у цій партії',
      role_reveal_close: 'Зрозуміло, до гри! 🎭',
      welcome_title: 'Вітання від розробника!',
      welcome_sub: 'Mafia Club: Online • Перший публічний реліз',
      welcome_body_html:
        '<p>Привіт, детективе! 🕵️</p>' +
        '<p>Мене звати <b>Itaminx</b>, і це — <b>моя перша онлайн-гра</b>. Я вклав у неї душу, щоб повернути живу атмосферу класичної настільної «Мафії» прямо в телефон та браузер.</p>' +
        '<p>Попереду заплановано багато оновлень: нові ролі, турніри Сімей, сезонні події, ще більше кастомізації та ігрових фішок!</p>' +
        '<p style="color:#80ffdb; margin-bottom:0;">Дуже чекаю на вашу <b>підтримку, чесну критику та будь-які ідеї</b> — найкращі пропозиції гравців обов\'язково потраплять у наступні апдейти!</p>',
      ph_welcome_idea: 'Напишіть ідею, баг або побажання розробнику...',
      welcome_btn_ideas: '💡 Надіслати ідею / відгук',
      welcome_btn_start: '🎭 Перейти до гри!',
      mg_title: '🎮 Міні-ігри в очікуванні старту',
      mg_tab_runner: '🏃 Нуар-Раннер',
      mg_tab_jump: '⬆️ Мафія Джамп',
      mg_tab_memory: '🃏 Пам\'ять ролей',
      mg_tab_whack: '🎯 Впіймай Мафію',
      tr_choose_lang: '🌐 Оберіть мову перекладу',
      tr_choose_hint: 'Вибрана мова збережеться — наступні повідомлення перекладатимуться в 1 клік!',

      // Dynamic JS helpers
      translate_btn: '🌐 Перекласти',
      tr_btn_short: 'Переклад',
      translating: 'Переклад...',
      translated_prefix: 'Переклад',
      donate_unavailable_title: '💳 Донат тимчасово недоступний',
      mg_room_top: 'Топ кімнати',
      mg_global_top: 'Рекорди сервера',
      mg_no_scores: 'Ще немає рекордів',

      // New UI & Modals
      auth_forgot_btn: '🔑 Забули пароль?',
      mod_sec_staff: '👑 Персонал: Братік, Тестери, Модери та Паролі',
      mod_bratik_title: '🤝 Призначити посаду «Братік» (повний доступ + свій код):',
      mod_bratik_grant: '🤝 Братік',
      mod_tester_title: '🧪 Додати Тестера (+10 000 🪙, +1 000 ⭐, +250 💎, VIP):',
      mod_tester_grant: '🧪 +Тестер',
      mod_role_title: '🛡️ Призначити / зняти Модератора (перегляд скарг, мути):',
      mod_pwd_resets_title: '🔑 Запити на скидання пароля:',
      room_modes_info_sum: 'ℹ️ Як працюють Рангова та Приватна кімнати?',
      room_modes_info_html:
        '<b>🏆 Рангова кімната:</b> захист від змови — у матч не можуть зайти друзі зі списку або гравці з одного IP/мережі, а перемога дає <b>+50% авторитету (⭐)</b>.<br>' +
        '<b>🔒 Приватна кімната:</b> закритий стіл лише для своїх — вхід виключно за заданим паролем (спостерігачів без пароля не пускає).',
      room_min_karma: 'Бажана мінімальна карма:',
      lobby_hire_bots_btn: '🤖 Боти (25 🪙)',
      settings_lang_grp: '🌐 Мови та переклад',
      settings_theme_grp: '🎨 Тема оформлення та логотип',
      settings_push_btn: '🔔 Увімкнути сповіщення в шторці телефону',
      settings_acc_grp: '👤 Профіль і відновлення пароля',
      settings_rec_code_lbl: '🔑 Код відновлення пароля (збережіть його):',
      settings_email_lbl: 'E-mail для відновлення доступу:',
      mg_tab_cannon: '💥 Гармата',
      mg_tab_snake: '🐍 Змійка',
      mg_tab_tetris: '🧱 Тетріс',
      fp_title: '🔑 Відновлення пароля',
      fp_tab_code: '🔑 Код / E-mail',
      fp_tab_admin: '📩 Через Адміна',
      fp_code_hint: 'Введіть ваш нікнейм (або E-mail), код відновлення з Налаштувань (або прив\'язаний E-mail) та новий пароль.',
      fp_ph_id: 'Нікнейм або E-mail...',
      fp_ph_code: 'Код відновлення або ваш E-mail...',
      fp_ph_newpass: 'Новий пароль (мін. 6 символів)...',
      fp_btn_reset: '✅ Змінити пароль',
      fp_admin_hint: 'Не маєте коду? Надішліть запит Адміну або Братіку — після підтвердження ваш новий пароль запрацює.',
      fp_ph_note: 'Примітка (напр. ваш Telegram або причина)...',
      fp_btn_send_req: '📩 Надіслати запит адміну',
      bratik_setup_title: 'Вас призначено Братіком!',
      bratik_setup_desc: 'Тепер у вас є повний довірений доступ до адмін-панелі. Придумайте свій особистий секретний код — його потрібно буде вводити при кожному вході:',
      bots_modal_title: '🤖 Додати розумних ботів',
      bots_modal_desc: 'Кожен з 16 ботів має унікальний характер, голос і тактику в чаті. Оберіть потрібних ботів або додайте випадкових:',
      bots_add_3: '🎲 +3 випадкових',
      bots_hire_selected: '✅ Додати обраних',
      afk_modal_title: '⚠️ Гравці покинули гру достроково',
      afk_modal_desc: 'Ці гравці вийшли завчасно або не зробили жодного ходу за кілька днів. Можливо, стався збій зв\'язку або це було зроблено навмисно — оберіть реакцію:',
      edit_ring_color_lbl: 'Стандартний колір ободка навколо фото:',
      settings_version_lbl: 'Версія гри:',
      version_changelog_hint: 'Що нового в оновленні',
      changelog_open_news: '📰 До новин',
      changelog_btn_ok: '✅ Зрозуміло!'
    },
    en: {
      // Auth & Branding
      logo_bottom_line: 'MAFIA CLUB ONLINE • THE GAME BEGINS',
      auth_choose_lang: 'Language / Мова:',
      auth_tab_login: '🔑 Sign In',
      auth_tab_reg: '✨ Register',
      auth_tab_email: '✉️ E-mail / Google',
      auth_tab_guest: '🎭 Guest',
      auth_email_create_lbl: 'Create a new account via E-mail',
      ph_email: 'Your E-mail (example@gmail.com)...',
      ph_nickname: 'Enter your nickname...',
      ph_password: 'Enter password (min 4 chars)...',
      auth_reg_gender: 'Choose character gender:',
      gender_male: '👨 Male',
      gender_female: '👩 Female',
      gender_other: '🎭 Other',
      ph_ref_code: 'Inviter friend nickname (+500 🪙 bonus, optional)',
      auth_login_btn: 'Enter Game',
      cookie_banner_text: '🍪 We use localStorage and cookies to save your session and preferences (GDPR).',
      cookie_accept_btn: 'Accept',

      // Main Menu
      happy_hour_banner: '🔥 HAPPY HOURS (Kyiv): x2 XP & Coins in every match right now!',
      title_avatar_zoom: 'Tap to enlarge photo',
      title_badge_details: 'Tap for details',
      stat_level_lbl: 'Level ',
      stat_auth_lbl: 'Authority ',
      stat_coins_lbl: 'Coins ',
      stat_diamonds_lbl: 'Diamonds ',
      menu_join_quick: 'Join Room',
      menu_join_sub: 'Find an open table',
      menu_create_quick: 'Create Room',
      menu_create_sub: 'Customize your match',
      menu_mod: '🛠️ Admin & Mod Panel',
      tile_friends: 'Friends/Clan',
      tile_shop: 'Shop',
      tile_quests: 'Quests',
      tile_global: 'Global',
      tile_top: 'Top-100',
      tile_rules: 'Rules',
      tile_profile: 'Profile',
      tile_settings: 'Settings',
      menu_dev: '📰 News',
      menu_author: '👨‍💻 Dev',
      menu_ideas: '💌 Ideas',
      menu_install_app: '📲 Install App (Phone / PC)',
      mod_export_db: '💾 Download DB Backup (.json)',
      mod_import_db: '📂 Restore DB from File (.json)',

      // Common Buttons
      btn_back_menu: '← Back to Menu',
      btn_back: '← Back',
      btn_close: 'Close',
      btn_save: 'Save',
      btn_cancel: 'Cancel',
      btn_confirm: 'Confirm',
      btn_exit: '🚪 Leave',
      btn_send_title: 'Send (Enter)',

      // Mod Panel
      mod_refresh: '🔄 Refresh',
      mod_title: '🛠️ Admin & Mod Panel',
      mod_sec_dash: '📊 Live Project Dashboard',
      mod_online_hint: '👥 Players Online (tap to insert nick):',
      mod_sec_bots: '🤖 Bots & Phase Control (Current Room)',
      mod_add4: '+4 Bots',
      mod_add8: '+8 Bots',
      mod_clear_bots: '✕ Clear',
      mod_skip_phase: '⏩ Skip Phase Timer (to 1s)',
      mod_bot_style_lbl: 'Bot behavior style:',
      mod_bot_style_bal: 'Balanced (smart play)',
      mod_bot_style_agg: 'Aggressive (frequent accusations)',
      mod_bot_style_caut: 'Cautious (quiet play)',
      mod_bot_order_title: 'Order a specific bot:',
      ph_mod_bot_nick: 'Bot nickname (e.g. Bot_Alex)',
      ph_mod_bot_say: 'Chat message...',
      mod_bot_say_btn: '💬 Say',
      ph_mod_bot_vote: 'Vote target...',
      mod_bot_vote_btn: '🗳️ Vote',
      mod_sec_reports: '🚩 Player Reports',
      mod_rep_open: '🔴 Open',
      mod_rep_closed: '🟢 Closed',
      mod_rep_all: '📋 All',
      ph_mod_rep_search: '🔍 Search reports by nick or reason...',
      mod_sec_punish: '🔨 Punishments & Appeals',
      ph_player_nick: 'Player nickname...',
      pun_warn: '⚠️ Warning (-10 karma)',
      pun_m30: '🔇 Chat Mute 30 min',
      pun_m2h: '🔇 Chat Mute 2 hours',
      pun_m24h: '🔇 Chat Mute 24 hours',
      pun_pb24h: '🎮 Play Ban 24 hours (chats allowed)',
      pun_pb7d: '🎮 Play Ban 7 days (chats allowed)',
      pun_pbperm: '🎮 Permanent Play Ban (chats allowed)',
      pun_tb24h: '⏳ Temp Ban 24 hours',
      pun_tb7d: '⏳ Temp Ban 7 days',
      pun_permban: '🚫 Permanent Ban',
      ph_pun_reason: 'Punishment reason (optional)...',
      mod_apply_punish: '⚖️ Apply Punishment',
      mod_unmute: '🔊 Unmute',
      mod_unplayban: '🎮 Lift Play Ban',
      mod_unban: '🔓 Unban',
      mod_active_puns: '📋 Active mutes, play bans & bans:',
      mod_sec_gift: '🎁 Grant Player Reward',
      lbl_coins: 'Coins 🪙',
      lbl_diamonds: 'Diamonds 💎',
      lbl_auth: 'Authority ⭐',
      lbl_xp: 'Experience XP',
      ph_mod_gift_comment: 'Admin comment (e.g. For great play!)',
      mod_grant_btn: '🎁 Grant Reward',
      mod_sec_anticheat: '🕵️ Suspicious Activity (Anti-Cheat)',
      mod_ac_hint: 'Automatically flagged cheat / spam attempts:',
      mod_clear_btn: '🧹 Clear',
      mod_sec_ideas: '💡 Player Ideas & Feedback',
      mod_sec_news: '📰 Publish Dev Updates',
      ph_post_title: 'News headline...',
      ph_post_text: 'Update details or patch notes...',
      mod_pub_post: '📢 Publish to All',
      mod_sec_logs: '📜 Moderator Action Log',

      // Quests & Profile
      quests_title: '🎯 Daily Quests',
      profile_stats_title: '📊 Player Statistics',
      profile_history_title: '📜 Match History',
      profile_no_history: 'No matches played yet.',

      // Play / Create Room
      play_create_room: '➕ Create Room',
      play_new_room_title: 'New Room Settings',
      ph_room_name: 'Room name',
      mode_classic_opt: 'Mode: Classic',
      mode_legend_opt: 'Mode: Legend (from 100 games)',
      room_is_ranked: ' 🏆 Ranked (Anti-teaming)',
      room_is_private: ' 🔒 Private (Password)',
      ph_room_pass: 'Private room password...',
      room_min_p: 'Minimum players:',
      room_max_p: 'Maximum players:',
      room_min_auth: 'Minimum entry authority:',
      room_pick_roles: 'Select roles for this room:',
      room_submit_btn: '🟢 Create Room & Enter Lobby',
      play_active_rooms: 'Active & Open Rooms',
      play_no_rooms: 'No open rooms yet. Be the first to create one!',

      // Lobby & Room
      lobby_default_title: 'Room Lobby',
      btn_invite: '🔗 Invite',
      btn_mod_short: '🛠️ Mod',
      lobby_waiting: '⏳ Waiting for players...',
      tag_classic: 'CLASSIC',
      lobby_roles_summary: '🎭 Roles in This Room',
      lobby_players_lbl: 'Players in lobby',
      lobby_minigames_btn: '🎮 Mini-Games While Waiting',
      lobby_start_btn: '▶️ Start Match Now',
      lobby_chat_title: '💬 LOBBY CHAT (Separate from Match)',
      ph_lobby_msg: 'Chat in lobby... (Enter to send)',
      title_send_lobby: 'Send to lobby',
      room_default_title: 'Room',
      my_role_pill_default: '🎭 Role',
      title_role_pill: 'Tap to inspect your role description',
      dead_free_play_text: '👻 You are eliminated — keep watching or freely create/join another match with no penalty.',
      dead_free_play_btn: '🎮 Other Rooms',
      room_last_will: '📜 Last Word:',
      ph_last_will: 'Write your final message for the Town...',
      room_last_will_btn: 'Send',
      room_players: '👥 Players',
      room_click_mention: '• tap name = mention in chat',
      channel_day_default: '☀️ DAYTIME DISCUSSION',
      react_suspicion: 'Suspect',
      react_quiet: 'Quiet',
      react_mafia: 'Mafia?',
      react_dead: 'Dead',
      react_agree: 'Agree',
      react_disagree: 'Disagree',
      react_shock: 'Shock',
      react_question: 'Question',
      react_candle: 'Candle',
      react_mask: 'Mask',
      react_cheers: 'Cheers',
      room_gift_target_lbl: 'Gift recipient:',
      room_gift_incognito: '🕵️ Incognito (+15 🪙 or free with VIP)',
      title_emoji_btn: 'Emojis',
      title_gift_btn: 'Send a table gift',
      ph_room_msg: 'Write a message... (Enter to send)',
      title_send_msg: 'Send message (Enter)',
      room_roles_list: '🎭 Roles in This Room',
      btn_share_match: '📸 Share Match Result Card',

      // Friends & Private Chat
      friends_title: '👥 Friends, Search & Mafia Family',
      tab_friends: '🔍 Search & Friends',
      tab_reqs: '📩 Requests',
      tab_family: '⚜️ Family',
      friends_search_lbl: 'Find player by nickname (or leave blank for directory):',
      ph_search_player: 'Enter player nickname...',
      btn_search: '🔍 Find',
      ref_title: '🎁 Referral Link (Invite a Friend):',
      ref_desc: '1 friend = +500 🪙 & stickers; 3 friends = Frame + 3d VIP; 5 friends = "Godfather" Title.',
      ref_copy_btn: '📋 Copy My Referral Link',
      friends_my_hdr: 'My Friends:',
      friends_empty: 'Your friends list is empty.',
      friends_no_reqs: 'No incoming friend requests.',
      pm_back_friends: '← Back to Friends',
      pm_default_title: '✉️ Chat with Player',
      ph_pm_msg: 'Write a private message... (Enter to send)',

      // Shop & Donate
      shop_title: '🛒 Shop, Donate & Customization',
      shop_cat_all: 'All',
      shop_cat_gift: '🎁 Gifts',
      shop_cat_frame: '🖼️ Frames',
      shop_cat_death_fx: '💥 Death FX',
      shop_cat_premium: '👑 VIP / Boost',
      shop_cat_exchange: '💎 Exchange 💎→🪙',
      shop_cat_donate: '💳 Support / Donate',

      // Rules
      rules_title: '📖 Rules & Roles',
      rules_how_to_html:
        '<b>How the match flows:</b><br>' +
        '• <b>Night (Mafia Chat — 30s):</b> Mafia coordinates in secret chat (Medium eavesdrops anonymously).<br>' +
        '• <b>Night (Actions — 30s):</b> Active roles select their nightly target.<br>' +
        '• <b>Day (Discussion — 60s):</b> Living players debate night events.<br>' +
        '• <b>Day (Voting — 30s):</b> Town votes to exile a suspect.',
      rules_teams_title: '⚖️ Teams, Karma & Authority (tap ▾ to expand):',
      rules_town_sum: '🏙️ Town Faction',
      rules_town_html: 'Goal: identify and eliminate <b>all Mafia and Cult members</b> during daytime votes. Town wins only when zero Mafia and Cult players remain alive.',
      rules_mafia_sum: '🔫 Mafia Syndicate',
      rules_mafia_html: 'Coordinates in secret night chat and strikes a target. Wins <b>only when all Town and Cult players are eliminated</b>!',
      rules_cult_sum: '🕯️ The Cult',
      rules_cult_html: 'Every night, the Cult Leader converts one unprotected Town player. Cult wins when Mafia is gone and Cult holds the majority, or all enemies are gone.',
      rules_neutral_sum: '🃏 Neutrals (Jester, Amnesiac, Guardian Angel)',
      rules_neutral_html: 'Each neutral has a unique win condition: <b>Jester</b> wins instantly if executed by day vote; <b>Amnesiac</b> remembers a dead player\'s role and team; <b>Guardian Angel</b> wins with Town or by surviving.',
      rules_karma_sum: '🛡️ Karma (Fair Play) & ⭐ Authority',
      rules_karma_html: '<b>Karma (0–100):</b> drops by -12 for leaving alive and -10 for mute/warn; below 50 locks high-tier rooms. Recovers (+2) per completed match.<br><b>Authority:</b> grows with wins, unlocks higher-authority rooms, and ranks the Top-100.',
      rules_roles_hdr: '🎭 All Roles Guide:',

      // Global & Top
      global_title: '🌍 Global Chat',
      ph_global_msg: 'Message global chat... (Enter to send)',
      top_title: '🏆 Top-100 Leaderboard',
      top_all_btn: 'All Time',
      top_today_btn: 'Today',

      // Settings
      settings_title: '⚙️ Settings',
      settings_show_badge: 'Show Badge 100 next to nickname',
      settings_audio_grp: '🔊 Audio & Effects',
      settings_sfx_toggle: 'UI & Game Event Sound Effects',
      settings_vol_lbl: 'Sound Volume:',
      settings_chat_grp: '💬 Chat & Readability',
      settings_font_lbl: 'Font Size (Chat & Interface):',
      font_opt_11: 'Small (11px) — compact',
      font_opt_13: 'Standard (13px)',
      font_opt_15: 'Large (16px) — easy on eyes',
      font_opt_17: 'Extra Large (19px)',
      font_preview_html: '👁️ Text Preview: <b>The Sheriff investigates a suspect tonight.</b>',
      settings_chat_style_lbl: 'Message Bubble Style:',
      style_opt_bubbles: 'Modern Neon Bubbles (rounded)',
      style_opt_classic: 'Classic Compact Lines',
      settings_tr_lang_lbl: '🌐 1-Click Chat Translation Language:',
      settings_anim_grp: '✨ Interface & Animations',
      settings_anim_toggle: 'Smooth animations & glow effects',
      settings_profanity_title: '🛡️ Profanity Filter',
      settings_profanity_toggle: 'Hide bad words (***)',
      settings_profanity_words: 'Your custom blocked words (comma-separated):',
      ph_custom_words: 'word1, word2...',
      settings_profanity_save: '💾 Save',
      settings_nick_lbl: 'Change nickname (1 free change per account):',
      ph_new_nick: 'New nickname...',
      settings_logo_lbl: 'Game Logo Theme:',
      logo_gold: '👑 Godfather (Metallic Gold)',
      logo_ruby: '♦️ Syndicate (Ruby & Steel)',
      logo_emerald: '🐍 Night Shadow (Emerald Neon)',
      settings_lang: 'Interface Language:',
      btn_logout: '🚪 Log Out',
      btn_gdpr_del: '🗑️ Delete Account & All Data (GDPR)',

      // Dev Screen
      dev_news_title: '📰 Development News',
      dev_email_hdr: 'Contact Developer via E-mail',
      dev_email_addr: 'Developer E-mail: itaminx16@gmail.com',
      ph_email_subj: 'Subject...',
      ph_email_body: 'Your message...',
      dev_email_send: '✉️ Send to itaminx16@gmail.com',

      // Modals
      dev_modal_title: '🔐 Developer Verification',
      ph_secret_code: 'Secret code...',
      zoom_avatar_hint: 'Tap photo again to edit avatar, gender, or bio',
      edit_prof_title: '✏️ Edit Profile',
      edit_upload_photo: 'Or upload a custom photo from device:',
      edit_gender_lbl: 'Gender:',
      edit_bio_lbl: 'Profile bio:',
      badge_modal_default: '🏅 Badge 100',
      badge_show_toggle: 'Display badge next to nickname',
      btn_got_it: 'Got it',
      pub_prof_default: 'Player',
      pub_add_friend: '➕ Add Friend',
      pub_remove_friend: '✕ Remove Friend',
      pub_send_sms: '✉️ Send Private Message',
      pub_report: '🚩 Report Player',
      room_players_modal_title: '👥 Players in Room',
      match_card_title: '📸 Match Result Card',
      match_card_save: '💾 Save / Share',
      rep_modal_title: '🚩 Report a Player',
      rep_offender_lbl: 'Offender:',
      rep_cat_lbl: 'Violation Category:',
      rep_cat_insults: '🤬 Insults & Profanity',
      rep_cat_gamethrow: '🎭 Gamethrowing / Team Sabotage',
      rep_cat_spam: '📢 Chat Spam or Flood',
      rep_cat_blackmail: '⚠️ Harassment or Toxic Behavior',
      rep_cat_other: '📝 Other Violation',
      rep_details_lbl: 'Details or explanation:',
      ph_rep_details: 'Describe what happened...',
      rep_ss_lbl: 'Attach screenshot (upload or paste Ctrl+V):',
      rep_ss_remove: '✕ Remove Screenshot',
      rep_auto_ctx: '💡 Last 12 chat messages from you and the reported player are attached automatically for moderation.',
      rep_submit_btn: 'Submit Report',
      reward_title: 'Reward Granted!',
      reward_claim_btn: 'Awesome! Claim Reward 🚀',
      ss_view_title: '🖼️ Report Screenshot Preview',
      role_reveal_hdr: 'Your Role in This Match',
      role_reveal_close: 'Got it, Ready to Play! 🎭',
      welcome_title: 'Welcome Note from the Developer!',
      welcome_sub: 'Mafia Club: Online • First Public Release',
      welcome_body_html:
        '<p>Hello, Detective! 🕵️</p>' +
        '<p>My name is <b>Itaminx</b>, and this is <b>my very first online game</b>. I poured my heart into bringing the tense social deduction spirit of tabletop Mafia straight to mobile and web.</p>' +
        '<p>Many updates are planned ahead: new roles, Clan tournaments, seasonal events, more customization, and fresh mechanics!</p>' +
        '<p style="color:#80ffdb; margin-bottom:0;">I truly welcome your <b>support, honest feedback, and ideas</b> — the best community suggestions will make it into upcoming updates!</p>',
      ph_welcome_idea: 'Share an idea, bug report, or wish for the developer...',
      welcome_btn_ideas: '💡 Send Idea / Feedback',
      welcome_btn_start: '🎭 Enter the Game!',
      mg_title: '🎮 Lobby Mini-Games',
      mg_tab_runner: '🏃 Noir Runner',
      mg_tab_jump: '⬆️ Mafia Jump',
      mg_tab_memory: '🃏 Role Memory',
      mg_tab_whack: '🎯 Catch Mafia',
      tr_choose_lang: '🌐 Choose Translation Language',
      tr_choose_hint: 'Your choice is saved — future messages translate in 1 click!',

      // Dynamic JS helpers
      translate_btn: '🌐 Translate',
      tr_btn_short: 'Translate',
      translating: 'Translating...',
      translated_prefix: 'Translated',
      donate_unavailable_title: '💳 Donations Temporarily Unavailable',
      mg_room_top: 'Room Top',
      mg_global_top: 'Server Records',
      mg_no_scores: 'No scores yet',

      // New UI & Modals
      auth_forgot_btn: '🔑 Forgot password?',
      mod_sec_staff: '👑 Staff: Bratik, Testers, Moderators & Passwords',
      mod_bratik_title: '🤝 Assign "Bratik" rank (full trusted access + personal code):',
      mod_bratik_grant: '🤝 Bratik',
      mod_tester_title: '🧪 Add Tester (+10,000 🪙, +1,000 ⭐, +250 💎, VIP):',
      mod_tester_grant: '🧪 +Tester',
      mod_role_title: '🛡️ Assign / remove Moderator (reports review, mutes):',
      mod_pwd_resets_title: '🔑 Password Reset Requests:',
      room_modes_info_sum: 'ℹ️ How do Ranked and Private rooms work?',
      room_modes_info_html:
        '<b>🏆 Ranked Room:</b> anti-teaming protection — friends on your list or players sharing the same IP/network cannot join together, and winning grants <b>+50% authority (⭐)</b>.<br>' +
        '<b>🔒 Private Room:</b> locked table for invited players only — requires the exact password (spectators without password are blocked).',
      room_min_karma: 'Preferred minimum karma:',
      lobby_hire_bots_btn: '🤖 Bots (25 🪙)',
      settings_lang_grp: '🌐 Languages & Translation',
      settings_theme_grp: '🎨 Color Theme & Logo',
      settings_push_btn: '🔔 Enable phone notification shade alerts',
      settings_acc_grp: '👤 Profile & Password Recovery',
      settings_rec_code_lbl: '🔑 Password recovery code (save it safely):',
      settings_email_lbl: 'E-mail for account recovery:',
      mg_tab_cannon: '💥 Ball Blast',
      mg_tab_snake: '🐍 Snake',
      mg_tab_tetris: '🧱 Tetris',
      fp_title: '🔑 Password Recovery',
      fp_tab_code: '🔑 Code / E-mail',
      fp_tab_admin: '📩 Via Admin',
      fp_code_hint: 'Enter your nickname (or E-mail), the recovery code from Settings (or linked E-mail), and your new password.',
      fp_ph_id: 'Nickname or E-mail...',
      fp_ph_code: 'Recovery code or linked E-mail...',
      fp_ph_newpass: 'New password (min. 6 chars)...',
      fp_btn_reset: '✅ Reset Password',
      fp_admin_hint: 'Don\'t have a recovery code? Send a request to Admin or Bratik — your new password will activate once approved.',
      fp_ph_note: 'Note (e.g. your Telegram or reason)...',
      fp_btn_send_req: '📩 Send Request to Admin',
      bratik_setup_title: 'You Were Appointed Bratik!',
      bratik_setup_desc: 'You now have full trusted access to the Admin Panel. Create your personal secret code — you will enter it on every login:',
      bots_modal_title: '🤖 Add Smart Bots',
      bots_modal_desc: 'Each of the 16 bots has a unique personality, voice, and table tactics. Select specific bots or add 3 random ones:',
      bots_add_3: '🎲 +3 Random',
      bots_hire_selected: '✅ Hire Selected',
      afk_modal_title: '⚠️ Players Left the Match Early',
      afk_modal_desc: 'These players left before the end or made no moves over several days. It may have been connection trouble or intentional — choose your response:',
      edit_ring_color_lbl: 'Default avatar border ring color:',
      settings_version_lbl: 'Game version:',
      version_changelog_hint: 'What\'s new in this update',
      changelog_open_news: '📰 View News',
      changelog_btn_ok: '✅ Got it!'
    }
  };

  const ROLE_UA_TO_EN = {
    'Мирний житель': 'Citizen',
    'Шериф': 'Sheriff',
    'Лікар': 'Doctor',
    'Коханка': 'Escort',
    'Мафіозі': 'Mafioso',
    'Дон Мафії': 'Godfather',
    'Охоронець': 'Bodyguard',
    'Тюремник': 'Jailor',
    'Репортер': 'Journalist',
    'Медіум': 'Medium',
    'Мер міста': 'Mayor',
    'Месник': 'Vigilante',
    'Адвокат': 'Framer',
    'Шантажист': 'Blackmailer',
    'Консильєре': 'Consigliere',
    'Янгол-Охоронець': 'Guardian Angel',
    'Лідер Культу': 'Cult Leader',
    'Амнезіак': 'Amnesiac',
    'Джокер': 'Jester'
  };

  window.currentLang = localStorage.getItem('mafia_lang') === 'en' ? 'en' : 'ua';

  window.isEn = function () {
    return window.currentLang === 'en';
  };

  window.loc = function (ua, en) {
    return window.currentLang === 'en' ? en : ua;
  };

  window.localizeRoleName = function (uaName) {
    if (!uaName || window.currentLang !== 'en') return uaName;
    const str = String(uaName).trim();
    if (str.endsWith(', обернений у Культ')) {
      const base = str.replace(/,\s*обернений у Культ$/, '').trim();
      return (ROLE_UA_TO_EN[base] || base) + ', converted to Cult';
    }
    return ROLE_UA_TO_EN[str] || uaName;
  };

  window.localizeServerText = function (text) {
    const raw = String(text == null ? '' : text);
    if (!raw || window.currentLang !== 'en') return raw;

    const exact = {
      'Будь ласка, увійдіть у свій профіль!': 'Please log in to your account!',
      'Кімнату не знайдено або її вже закрито.': 'Room not found or already closed.',
      'Кімнату закрито творцем.': 'The room was closed by its creator.',
      'Вашу кімнату успішно закрито.': 'Your room has been closed successfully.',
      'Гра вже почалася! Ви можете зайти як спостерігач.': 'Match already in progress! You can join as a spectator.',
      'Кімната заповнена!': 'Room is full!',
      'Невірний пароль від приватної кімнати!': 'Incorrect private room password!',
      'Потрібно мінімум 3 гравці (або додайте ботів через Мод-меню)!': 'Need at least 3 players (or add bots via Mod Menu)!',
      'Низька карма (<50): доступні лише кімнати 1 рівня.': 'Low karma (<50): only tier-1 rooms available.',
      'Через низьку карму (<50) ви можете створювати лише базові кімнати.': 'Due to low karma (<50), you can only create basic rooms.',
      'Анти-тімінг: у рангову гру не можна заходити разом із друзями або з одного IP!': 'Anti-teaming: cannot join a ranked match with friends or the same IP!',
      '🔒 Режим «Легенда» відкривається після 100 зіграних партій!': '🔒 Legend mode unlocks after 100 played matches!',
      '🔒 У кімнату режиму «Легенда» можна зайти лише від 100 зіграних ігор!': '🔒 Joining a Legend room requires at least 100 played games!',
      'Акаунт не знайдено!': 'Account not found!',
      'Невірний пароль!': 'Incorrect password!',
      'Сесія застаріла. Введіть пароль ще раз.': 'Session expired. Please re-enter your password.',
      'Введіть коректний E-mail!': 'Enter a valid E-mail address!',
      'Пароль має містити щонайменше 4 символи!': 'Password must be at least 4 characters long!',
      'Акаунт з таким E-mail вже існує! Увійдіть.': 'An account with this E-mail already exists! Please sign in.',
      'Акаунт з таким E-mail не знайдено!': 'No account found with this E-mail!',
      'Некоректний токен Google.': 'Invalid Google token.',
      'Не вдалося отримати дані Google-профілю.': 'Failed to fetch Google profile data.',
      'Google-вхід ще не налаштований на сервері (потрібен GOOGLE_CLIENT_ID). Використайте вкладку E-mail або Вхід.': 'Google Sign-In is not configured on the server yet (GOOGLE_CLIENT_ID needed). Use E-mail or Sign In!',
      '🎭 Ролі роздано! Місто засинає... (Ніч №1)': '🎭 Roles dealt! Town falls asleep... (Night #1)',
      '🌅 Ніч минула спокійно, ніхто не загинув.': '🌅 The night passed peacefully; nobody died.',
      '🤷 Голосів не було — нікого не вигнано.': '🤷 No votes were cast — nobody was exiled.',
      '🤝 ГРУ ЗАВЕРШЕНО! Бойова нічия!': '🤝 MATCH ENDED! It is a draw!',
      '⚠️ Гравців стало менше мінімуму — автостарт скасовано.': '⚠️ Players fell below minimum — autostart cancelled.',
      '🔇 Вам видано мут модератором!': '🔇 You have been muted by a moderator!',
      '⏳ Антиспам: зачекайте 3 секунди.': '⏳ Anti-spam: wait 3 seconds.',
      '⚠️ Не дублюйте однакове повідомлення поспіль.': '⚠️ Do not repeat the same message twice in a row.',
      '🔇 Під час денного голосування чат вимкнено для всіх!': '🔇 Chat is disabled for everyone during daytime voting!',
      '🔇 Під час фази нічних дій чат вимкнено для всіх!': '🔇 Chat is disabled for everyone during night actions!',
      '🔇 Під час фази дій та голосування чат заблоковано!': '🔇 Chat is locked during action & voting phases!',
      '🤐 Вас зашантажовано вночі! Сьогодні ви не можете говорити.': '🤐 You were blackmailed last night! You cannot speak today.',
      '🌙 У 1-му етапі ночі чат доступний лише Мафії!': '🌙 In Night phase 1, chat is open to Mafia only!',
      '⏳ Нічні дії (Мафія, Лікар, Шериф та ін.) відкриваються у 2-му етапі ночі — після чату Мафії!': '⏳ Night actions unlock in Night Phase 2 — after the Mafia chat!',
      '🌙 Ваша роль не має активної нічної дії.': '🌙 Your role has no active night ability.',
      '🧠 Амнезіак може обрати лише вибулого гравця!': '🧠 Amnesiac may only target an eliminated player!',
      '⚠️ Цей гравець вже вибув!': '⚠️ That player is already eliminated!',
      '🏥 Ви не можете лікувати самого себе!': '🏥 You cannot heal yourself!',
      '💉 Не можна лікувати одного й того самого гравця дві ночі поспіль!': '💉 Cannot heal the same player two nights in a row!',
      '💃 Не можна блокувати самого себе!': '💃 You cannot distract yourself!',
      '🕵️ Неможливо діяти проти себе!': '🕵️ Cannot target yourself!',
      '🤝 Союзників по Мафії не можна обирати ціллю!': '🤝 Cannot target fellow Mafia allies!',
      '🕯️ Свого однодумця по Культу обрати не можна!': '🕯️ Cannot target a fellow Cult member!',
      '⚖️ Денне голосування за вигнання відкривається у фазі голосування (після обговорення)!': '⚖️ Daytime exile voting opens after discussion!',
      '🎭 У цій фазі немає активних дій.': '🎭 No active moves in this phase.',
      '⚠️ Отримувача не знайдено за цим столом!': '⚠️ Recipient not found at this table!',
      '⚠️ У вас немає цього подарунка в інвентарі! Придбайте його у Крамниці.': '⚠️ You do not own this gift! Buy one in the Shop.',
      '⚠️ Доплата за анонімність (Інкогніто) — 15 🪙!': '⚠️ Incognito fee is 15 🪙!',
      '🕯️ Вночі вас навернули у таємний Культ! Ваша нова мета — перемога Культу.': '🕯️ Last night you were converted into the Cult! Your new goal is a Cult victory.',
      '🕯️ Вночі вас навернули у таємний Культ! Ви стали культистом (без права вербувати інших), бачите всіх членів Культу і перемагаєте разом із Культом.': '🕯️ Last night you were converted into the secret Cult! You are now a Cultist (without the ability to convert others), can see all Cult members, and win with the Cult.',
      '🕯️ Навернені культисти не можуть вербувати інших — це право має лише Лідер Культу!': '🕯️ Converted Cultists cannot convert others — only the Cult Leader has that power!',
      'Рамку одягнено!': 'Frame equipped!',
      'Рамку знято!': 'Frame unequipped!',
      'Ефект активовано!': 'Effect activated!',
      'Ефект вимкнено!': 'Effect disabled!',
      'Недостатньо діамантів (💎)!': 'Not enough diamonds (💎)!',
      'Недостатньо монет (🪙)!': 'Not enough coins (🪙)!',
      'Невірний пакет обміну.': 'Invalid exchange package.',
      'Увійдіть у зареєстрований акаунт, щоб щодня забирати +500 🪙!': 'Sign in to a registered account to claim +500 🪙 daily!',
      '✅ Ви вже забрали сьогоднішні +500 🪙! Повертайтеся завтра.': '✅ You already claimed today\'s +500 🪙! Come back tomorrow.',
      '🎁 Вам нараховано щоденні +500 🪙 в якості вибачення!': '🎁 You received your daily +500 🪙 apology bonus!',
      'Донат тимчасово недоступний — прийміть +500 золота в якості вибачення!': 'Donations are temporarily unavailable — please enjoy +500 gold as our apology!',
      'Гості не можуть створювати Сім\'ю!': 'Guests cannot create a Family!',
      'Гості не можуть вступати у Сім\'ю!': 'Guests cannot join a Family!',
      '⚠️ Ви вже перебуваєте у Сім\'ї! Спочатку вийдіть із поточної.': '⚠️ You are already in a Family! Leave your current one first.',
      '⚠️ Ви вже є учасником Сім\'ї! Ви не можете вступити в нову.': '⚠️ You are already a Family member!',
      'Сім\'ю не знайдено.': 'Family not found.',
      'У цій Сім\'ї вже максимум гравців (30/30).': 'This Family is already full (30/30).',
      '⚠️ Назва Сім\'ї має містити мінімум 3 символи!': '⚠️ Family name must be at least 3 characters!',
      'Ви вийшли зі складу Сім\'ї.': 'You left the Family.',
      '⚠️ Вкажіть суму від 10 до 5000 🪙.': '⚠️ Enter an amount between 10 and 5000 🪙.',
      '❌ Недостатньо монет для внеску!': '❌ Not enough coins for this contribution!',
      '❌ Лише Дон (лідер) може призначати ранги у Сім\'ї!': '❌ Only the Don (leader) can assign Family ranks!',
      '❌ Виганяти учасників можуть лише Дон або Капо!': '❌ Only Don or Capo can kick members!',
      '❌ Неможливо вигнати Дона або себе!': '❌ Cannot kick the Don or yourself!',
      '❌ Капо не може вигнати іншого Капо!': '❌ A Capo cannot kick another Capo!',
      '✅ Ви вже відмітилися сьогодні у Сім\'ї!': '✅ You already checked in with your Family today!',
      '⏳ Ваша щоденна сімейна справа на сьогодні вже виконана!': '⏳ Your daily Family heist is already finished for today!',
      '❌ Покращення штабу за кошти казни можуть купувати лише Дон або Капо!': '❌ Only Don or Capo can buy HQ upgrades from the treasury!',
      '❌ Закріплювати девіз чи наказ клану можуть лише Дон або Капо!': '❌ Only Don or Capo can update the Family motto!',
      '⏳ Тост можна підіймати раз на 5 хвилин!': '⏳ You can raise a Family toast once every 5 minutes!',
      '🥂 Тост надіслано у чат Сім\'ї!': '🥂 Toast sent to the Family chat!',
      '📌 Оголошення Сім\'ї оновлено!': '📌 Family announcement updated!',
      '📌 Оголошення Сім\'ї очищено.': '📌 Family announcement cleared.',
      '⏳ Зачекайте 2 секунди перед наступним перекладом...': '⏳ Wait 2 seconds before the next translation...',
      '⚠️ Напишіть хоча б кілька слів!': '⚠️ Please write at least a few words!',
      '✅ Дякуємо! Вашу ідею та відгук передано розробнику!': '✅ Thank you! Your idea and feedback were sent to the developer!',
      'Ваш акаунт та всі персональні дані успішно видалено (GDPR).': 'Your account and all personal data have been permanently deleted (GDPR).',
      'Нікнейм має містити щонайменше 2 символи!': 'Nickname must be at least 2 characters long!',
      'Невірний секретний код розробника!': 'Invalid developer secret code!',
      'Цей нікнейм вже зайнятий!': 'This nickname is already taken!',
      'Хрещений батько': 'Godfather',
      'Хрещений Батько': 'Godfather',
      'Новий гравець Mafia Club: Online': 'New player of Mafia Club: Online',
      'Гравець Mafia Club: Online': 'Mafia Club: Online Player',
      'Увійшов через E-mail • Mafia Club: Online': 'Signed in via E-mail • Mafia Club: Online',
      'Увійшов через Google • Mafia Club: Online': 'Signed in via Google • Mafia Club: Online',
      'Гостьовий профіль': 'Guest Profile',
      'Гостьовий профіль (ще не зареєстрований)': 'Guest Profile (unregistered)',
      'Гості не можуть додавати друзів. Створіть акаунт!': 'Guests cannot add friends. Create an account!',
      'Особистий чат доступний лише для зареєстрованих акаунтів. Увійдіть знову!': 'Private chat is available only for registered accounts. Please sign in!',
      'Особисті повідомлення доступні лише для зареєстрованих акаунтів!': 'Direct messages are available only for registered accounts!',
      'Отримувача не знайдено!': 'Recipient not found!',
      'Таємний шанувальник': 'Secret Admirer',
      '🕵️ Таємний шанувальник': '🕵️ Secret Admirer',
      '🕵️ Невідомий мафіозі': '🕵️ Unknown Mafioso',
      '🤐 Вас зашантажували вночі! Сьогодні ви не можете говорити.': '🤐 You were blackmailed last night! You cannot speak today.',
      '⚠️ Не можна застосовувати нічну дію на самого себе!': '⚠️ You cannot use a night ability on yourself!',
      '⚠️ Не можна атакувати союзника по команді Мафії!': '⚠️ You cannot attack a fellow Mafia teammate!',
      '🕯️ Цей гравець уже належить до вашого Культу!': '🕯️ This player already belongs to your Cult!',
      '⏳ Тост за Сім\'ю можна підіймати раз на 5 хвилин!': '⏳ You can raise a Family toast once every 5 minutes!',
      'Порушення правил': 'Rule violation',
      '🚫 Пермабан': '🚫 Permaban',
      '⏳ Тимчасовий бан': '⏳ Temporary Ban',
      '🔇 Мут чату': '🔇 Chat Mute',
      '🎮 Заборона гри (Назавжди)': '🎮 Play-ban (Permanent)',
      '🎮 Заборона гри': '🎮 Play-ban',
      'Без причини': 'No reason specified',
      'Назавжди': 'Permanent',
      'Головне меню': 'Main Menu',
      'Дію виконано.': 'Action completed.',
      '❌ Гравця не знайдено або неможливо покарати адміністратора!': '❌ Player not found or cannot punish an administrator!',
      '❌ Гравця не знайдено!': '❌ Player not found!',
      '🔊 Модератор зняв з вас мут чату!': '🔊 A moderator unmuted your chat!',
      '🎮 Модератор зняв з вас заборону на гру! Тепер ви можете грати знову.': '🎮 A moderator lifted your play-ban! You can play matches again.',
      '🧹 Журнал підозрілих дій очищено.': '🧹 Suspicious activity log cleared.',
      'Неможливо видати мут!': 'Cannot mute this user!',
      'Мут від модератора': 'Muted by moderator',
      '✅ Скаргу успішно розглянуто.': '✅ Report resolved successfully.',
      '↩️ Скаргу перевідкрито': '↩️ Report reopened',
      '↩️ Скаргу перевідкрито та покарання скасовано!': '↩️ Report reopened and punishment revoked!',
      'Усіх ботів видалено з кімнати.': 'All bots removed from the room.',
      'Таймер поточної фази скорочено до 1 сек!': 'Current phase timer shortened to 1s!',
      'Живого бота з таким ніком не знайдено!': 'No alive bot found with that nickname!',
      'Вітаємо! Адміністрація нарахувала вам нагороду.': 'Congratulations! The administration granted you a reward.',
      '📰 Новину опубліковано в журналі розробки!': '📰 News post published to the dev blog!',
      'Неможливо заблокувати!': 'Cannot ban this user!',
      'Ваш акаунт заблоковано адміністратором.': 'Your account has been banned by an administrator.',
      'Нікнейм може містити максимум 10 символів!': 'Nickname can be at most 10 characters!',
      '⚠️ Нікнейм може містити максимум 10 символів!': '⚠️ Nickname can be at most 10 characters!',
      'Пароль має містити щонайменше 6 символів!': 'Password must be at least 6 characters!',
      '⚠️ Гравців стало менше мінімуму — автостарт скасовано.': '⚠️ Below minimum players — autostart cancelled.',
      '⚡ Усі гравці проголосували! Підсумок через 3 сек...': '⚡ Everyone voted! Results in 3s...',
      '⚡ Усі активні ролі зробили хід! Ранок через 3 сек...': '⚡ All active roles acted! Dawn in 3s...',
      '🔒 Ви вже обрали 2 гравців цієї ночі! Вибір зафіксовано.': '🔒 You already chose 2 players tonight! Target locked.',
      '🔒 Ваш голос уже зафіксовано! Змінити голос на іншого гравця не можна.': '🔒 Your vote is locked! You cannot switch votes.',
      'Вкажіть нікнейм/E-mail та код відновлення!': 'Enter nickname/E-mail and recovery code!',
      'Новий пароль має містити щонайменше 6 символів!': 'New password must be at least 6 characters!',
      'Акаунт не знайдено!': 'Account not found!',
      'Адмін-пароль змінюється через змінні середовища сервера.': 'Admin password is changed via server environment variables.',
      'Невірний код відновлення або E-mail!': 'Invalid recovery code or E-mail!',
      '✅ Пароль успішно змінено! Увійдіть із новим паролем.': '✅ Password changed! Sign in with your new password.',
      'Введіть ваш нікнейм!': 'Enter your nickname!',
      'Бажаний новий пароль має містити щонайменше 6 символів!': 'Desired new password must be at least 6 characters!',
      'Гравця з таким нікнеймом не знайдено!': 'Player with this nickname not found!',
      'Недоступно для акаунта розробника.': 'Not available for developer account.',
      '📩 Запит передано адміністратору/Братіку! Після підтвердження новий пароль запрацює.': '📩 Request sent to Admin/Bratik! Your new password will work once approved.',
      'Код має містити від 3 до 16 символів!': 'Code must be 3 to 16 characters!',
      '🔐 Особистий секретний код Братіка збережено! Надалі вводьте його при вході.': '🔐 Personal Bratik secret code saved! Enter it on future logins.',
      'Ботів можна додавати лише у відкритому лобі до старту гри!': 'Bots can only be added in an open lobby before match start!',
      'Оберіть хоча б одного бота!': 'Select at least one bot!',
      'У кімнаті вже немає вільних місць або досягнуто ліміт 16 ботів!': 'No free seats left or 16-bot limit reached!',
      'Обрані боти вже перебувають у цьому лобі!': 'Selected bots are already in this lobby!',
      'Гості не можуть купувати ботів (потрібно 25 🪙 за бота).': 'Guests cannot buy bots (costs 25 🪙 per bot).',
      'Запис не знайдено або вже скасовано.': 'Log entry not found or already reverted.',
      'Запит не знайдено.': 'Request not found.',
      '⛔ Призначати посаду «Братік» може лише головний розробник!': '⛔ Only the lead developer can assign Bratik!',
      '❌ Гравця не знайдено або роль недоступна!': '❌ Player not found or role unavailable!',
      '🛡️ Адміністрація скасувала попереднє рішення модератора щодо вас.': '🛡️ Administration reverted the previous moderator action against you.',
      'Аналітик': 'Analyst',
      'Інтуїтивна': 'Intuitive',
      'Провокатор': 'Provoker',
      'Миротворка': 'Peacemaker',
      'Блефер': 'Bluffer',
      'Шпигунка': 'Spy',
      'Тихій': 'Quiet',
      'Репортерка': 'Reporter',
      'Захисник': 'Protector',
      'Хитрунка': 'Clever',
      'Слідчий': 'Sleuth',
      'Адвокатка': 'Advocate',
      'Тактик': 'Tactician',
      'Лідерка': 'Leader',
      'Вартовий': 'Sentinel',
      'Агентка': 'Agent'
    };

    if (exact[raw]) return exact[raw];
    if (ROLE_UA_TO_EN[raw]) return ROLE_UA_TO_EN[raw];

    // Multi-news lines joined by ' | '
    if (raw.includes(' | ')) {
      return raw.split(' | ').map(part => window.localizeServerText(part)).join(' | ');
    }

    const r = (re, fn) => {
      const m = raw.match(re);
      return m ? fn(m) : null;
    };

    return (
      r(/^🌙 Ніч №(\d+) \(Етап 1\): Нічний чат Мафії \(30 с\)\. Активні ролі ходять у 2-му етапі\.$/,
        m => `🌙 Night #${m[1]} (Stage 1): Mafia night chat (30s). Active roles move in stage 2.`) ||
      r(/^🎯 Ніч №(\d+) \(Етап 2\): Час нічних дій — Мафія, Лікар, Шериф та активні ролі обирають ціль \(30 с\)\.$/,
        m => `🎯 Night #${m[1]} (Stage 2): Night actions — Mafia, Doctor, Sheriff & active roles pick targets (30s).`) ||
      r(/^☀️ День №(\d+): Місто прокидається! Обговорення в чаті \(60 с\)\.$/,
        m => `☀️ Day #${m[1]}: Town wakes up! Chat discussion (60s).`) ||
      r(/^⚖️ День №(\d+): Денне голосування за вигнання \(30 с\)\.$/,
        m => `⚖️ Day #${m[1]}: Daytime exile voting (30s).`) ||
      r(/^💀 Вночі було вбито (.+?) \((.+?)\)!$/,
        m => `💀 ${m[1]} (${window.localizeRoleName(m[2])}) was killed last night!`) ||
      r(/^💉 Лікар врятував життя гравцю (.+?)!$/,
        m => `💉 The Doctor saved ${m[1]}'s life!`) ||
      r(/^🛡️ Охоронець (.+?) ціною власного життя врятував (.+?) та вбив нападника (.+?)!$/,
        m => `🛡️ Bodyguard ${m[1]} sacrificed themselves to save ${m[2]} and killed attacker ${m[3]}!`) ||
      r(/^🔍 Перевірка (.+?): ЦЕ МАФІЯ!$/,
        m => `🔍 Investigation on ${m[1]}: MAFIA!`) ||
      r(/^🔍 Перевірка (.+?): Чистий\.$/,
        m => `🔍 Investigation on ${m[1]}: Innocent.`) ||
      r(/^🔍 Перевірка (.+?): (.+)$/,
        m => `🔍 Investigation on ${m[1]}: ${m[2]}`) ||
      r(/^🕵️ Розвідка Консильєре — (.+?): (.+?)\.$/,
        m => `🕵️ Consigliere Intel — ${m[1]}: ${window.localizeRoleName(m[2])}.`) ||
      r(/^📸 Зведення Репортера: (.+?) та (.+?) — в ОДНІЙ команді!$/,
        m => `📸 Journalist Report: ${m[1]} and ${m[2]} are on the SAME team!`) ||
      r(/^📸 Зведення Репортера: (.+?) та (.+?) — у РІЗНИХ командах!$/,
        m => `📸 Journalist Report: ${m[1]} and ${m[2]} are on DIFFERENT teams!`) ||
      r(/^📸 Зведення Репортера: (.+?) та (.+?) — (.+)$/,
        m => `📸 Journalist Report: ${m[1]} and ${m[2]} — ${m[3]}`) ||
      r(/^📸 Репортер: обрано 1\/2 \((.+?)\)\. Оберіть ще одного гравця для порівняння!$/,
        m => `📸 Journalist: selected 1/2 (${m[1]}). Pick one more player to compare!`) ||
      r(/^📸 Репортер порівняє вранці: (.+?) та (.+?)!$/,
        m => `📸 Journalist will compare at dawn: ${m[1]} and ${m[2]}!`) ||
      r(/^(.+?) Ви обрали ціль на Ніч №(\d+): (.+)$/,
        m => `${m[1]} Target selected for Night #${m[2]}: ${m[3]}`) ||
      r(/^🧠 Ви згадали минуле! Ваша нова роль: (.+?)\.$/,
        m => `🧠 Memory restored! Your new role: ${window.localizeRoleName(m[1])}.`) ||
      r(/^🕯️ До вашого Культу приєднався новий культист: (.+?)!$/,
        m => `🕯️ A new Cultist joined your Cult: ${m[1]}!`) ||
      r(/^🃏 Джокер (.+?) домігся свого вигнання і здобуває особисту перемогу! Гра триває між іншими командами!$/,
        m => `🃏 Jester ${m[1]} got themselves exiled and achieved a personal victory! The match continues between the other teams!`) ||
      r(/^Підозрілий рекорд у міні-грі (.+?): (\d+) \(ліміт (\d+)\)$/,
        m => `Suspicious mini-game score in ${m[1]}: ${m[2]} (limit ${m[3]})`) ||
      r(/^⚖️ Голоси розділилися порівну \((.+?)\)! Жереб вигнав (.+?) \((.+?)\)!$/,
        m => `⚖️ Tie vote (${m[1]})! Chance exiled ${m[2]} (${window.localizeRoleName(m[3])})!`) ||
      r(/^⚖️ Місто вигнало (.+?) \((.+?)\)!$/,
        m => `⚖️ Town exiled ${m[1]} (${window.localizeRoleName(m[2])})!`) ||
      r(/^🗳️ (.+?) голосує проти (.+)$/,
        m => `🗳️ ${m[1]} voted against ${m[2]}`) ||
      r(/^📜 Заповіт (.+?): «(.+)»$/,
        m => `📜 ${m[1]}'s Last Word: "${m[2]}"`) ||
      r(/^🏃 (.+?) покинув гру достроково \(-12 карми\)\.$/,
        m => `🏃 ${m[1]} left the match early (-12 karma).`) ||
      r(/^🎁 (.+?) подарував (.+?) \((.+?)\) гравцю (.+?)!$/,
        m => `🎁 ${m[1]} gifted ${m[2]} (${m[3]}) to ${m[4]}!`) ||
      r(/^🏆 ГРУ ЗАВЕРШЕНО! Перемогли: (.+?)!$/,
        m => `🏆 MATCH ENDED! Winners: ${m[1]}!`) ||
      r(/^🔥 Кімната заповнена \((.+?)\)! Гра розпочинається автоматично через 3 сек\.\.\.$/,
        m => `🔥 Room full (${m[1]})! Starting automatically in 3s...`) ||
      r(/^🔥 Кімната заповнена \((.+?)\)! Автостарт прискорено до 3 сек\.\.\.$/,
        m => `🔥 Room full (${m[1]})! Autostart sped up to 3s...`) ||
      r(/^⚠️ Ви ще живі у грі «(.+?)»! Дочекайтеся завершення (?:гри перед створенням нової|поточної гри)\.$/,
        m => `⚠️ You are still alive in "${m[1]}"! Wait for the match to finish.`) ||
      r(/^Потрібен авторитет (\d+)\+!$/,
        m => `Requires ${m[1]}+ authority!`) ||
      r(/^Успішно придбано: (.+)!$/,
        m => `Purchased successfully!`) ||
      r(/^Нагороду за завдання отримано: \+(.+?) 🪙!$/,
        m => `Quest reward claimed: +${m[1]} 🪙!`) ||
      r(/^Потрібно (.+?) 💎! Зараз у вас (.+?) 💎\.$/,
        m => `Need ${m[1]} 💎! You currently have ${m[2]} 💎.`) ||
      r(/^💱 Обміняно (.+?) 💎 на \+(.+?) 🪙!$/,
        m => `💱 Exchanged ${m[1]} 💎 for +${m[2]} 🪙!`) ||
      r(/^❌ Недостатньо монет! Потрібно (?:300|1500|1\s*500) 🪙, а у вас зараз (.+?) 🪙\.$/,
        m => `❌ Not enough coins! Need 1,500 🪙, you have ${m[1]} 🪙.`) ||
      r(/^🎉 Сім'ю «(.+?)» \[(.+?)\] успішно засновано!$/,
        m => `🎉 Family "${m[1]}" [${m[2]}] founded successfully!`) ||
      r(/^⚜️ Сім'ю «(.+?)» \[(.+?)\] засновано! Грайте матчі, поповнюйте казну та підіймайте рівень Сім'ї\.$/,
        m => `⚜️ Family "${m[1]}" [${m[2]}] founded! Play matches, donate to the treasury, and level up your Family.`) ||
      r(/^🤝 Ви вступили до Сім'ї «(.+?)» \[(.+?)\]!$/,
        m => `🤝 You joined Family "${m[1]}" [${m[2]}]!`) ||
      r(/^🤝 (.+?) приєднався до Сім'ї!$/,
        m => `🤝 ${m[1]} joined the Family!`) ||
      r(/^💰 (.+?) вніс у казну (.+?) 🪙 \(\+(.+?) рейтингу\)! Рівень Сім'ї: (.+?) \(\+(.+?)% XP\/монет\)\.$/,
        m => `💰 ${m[1]} donated ${m[2]} 🪙 to Treasury (+${m[3]} rating)! Family Level: ${m[4]} (+${m[5]}% XP/coins).`) ||
      r(/^✅ Внесено (.+?) 🪙 у казну Сім'ї!$/,
        m => `✅ Deposited ${m[1]} 🪙 to Family Treasury!`) ||
      r(/^📅 (.+?) пройшов щоденну перекличку! \+(.+?) 🪙 гравцю, \+(.+?) 🪙 у казну та \+(.+?) ⭐\.$/,
        m => `📅 ${m[1]} completed daily check-in! +${m[2]} 🪙 to player, +${m[3]} 🪙 to treasury & +${m[4]} ⭐.`) ||
      r(/^✅ Перекличку зараховано! Ви отримали \+(.+?) 🪙 та внесли \+(.+?) 🪙 у казну!$/,
        m => `✅ Check-in complete! You earned +${m[1]} 🪙 and added +${m[2]} 🪙 to Treasury!`) ||
      r(/^🕶️ (.+?) вдався! \+(.+?) 🪙 вам, \+(.+?) 🪙 в казну Сім'ї \(\+(.+?) ⭐\)!$/,
        m => `🕶️ Heist succeeded! +${m[2]} 🪙 to you, +${m[3]} 🪙 to Family Treasury (+${m[4]} ⭐)!`) ||
      r(/^🚨 Патруль зірвав «(.+?)», але ви втекли з \+(.+?) 🪙 \(\+(.+?) ⭐\)\.$/,
        m => `🚨 Patrol busted the heist, but you escaped with +${m[2]} 🪙 (+${m[3]} ⭐).`) ||
      r(/^💰 (.+?) провів справу «(.+?)»: \+(.+?) 🪙 собі та \+(.+?) 🪙 у казну!$/,
        m => `💰 ${m[1]} pulled off heist "${m[2]}": +${m[3]} 🪙 personal & +${m[4]} 🪙 to treasury!`) ||
      r(/^🚨 (.+?) ледве вирвався із засідки під час «(.+?)» \(\+(.+?) 🪙\)\.$/,
        m => `🚨 ${m[1]} barely escaped an ambush during "${m[2]}" (+${m[3]} 🪙).`) ||
      r(/^🏗️ (.+?) покращив (.+?) до Рівня (.+?) за (.+?) 🪙 з казни!$/,
        m => `🏗️ ${m[1]} upgraded HQ to Level ${m[3]} for ${m[4]} 🪙 from treasury!`) ||
      r(/^🎉 (.+?) покращено до Рівня (\d+)!$/,
        m => `🎉 Upgraded to Level ${m[2]}!`) ||
      r(/^✅ (.+?) вже покращено до максимального 3 рівня!$/,
        m => `✅ Already at max Level 3!`) ||
      r(/^❌ Недостатньо монет у казні! Потрібно (.+?) 🪙 \(зараз: (.+?) 🪙\)\.$/,
        m => `❌ Insufficient Treasury coins! Need ${m[1]} 🪙 (current: ${m[2]} 🪙).`) ||
      r(/^🥂 (.+?) підіймає келих за вірність і перемоги «(.+?)»!$/,
        m => `🥂 ${m[1]} raises a glass to the loyalty and victories of "${m[2]}"!`) ||
      r(/^🥃 (.+?) проголошує тост: «Нехай місто пам'ятає ім'я \[(.+?)\]!»$/,
        m => `🥃 ${m[1]} proposes a toast: "May the city remember the name [${m[2]}]!"`) ||
      r(/^🎩 (.+?) салютує капелюхом усій Сім'ї — разом до топу!$/,
        m => `🎩 ${m[1]} tips their hat to the entire Family — together to the top!`) ||
      r(/^🚫 Гравця (.+?) виключено зі Сім'ї\.$/,
        m => `🚫 ${m[1]} was removed from the Family.`) ||
      r(/^⚠️ Вас виключили зі складу Сім'ї «(.+?)»\.$/,
        m => `⚠️ You were removed from Family "${m[1]}".`) ||
      r(/^✅ Гравцю (.+?) призначено ранг «(.+?)»\.$/,
        m => `✅ Assigned new rank to ${m[1]}.`) ||
      r(/^🏆 Квест «(.+?)» виконано! \+(.+?) 🪙 в казну, \+(.+?) рейтингу та \+(.+?) 🪙 кожному члену!$/,
        m => `🏆 Clan Quest completed! +${m[2]} 🪙 treasury, +${m[3]} rating & +${m[4]} 🪙 per member!`) ||
      r(/^📩 Заявку у друзі надіслано гравцю (.+?)!$/,
        m => `📩 Friend request sent to ${m[1]}!`) ||
      r(/^🤝 Ви та (.+?) тепер друзі!$/,
        m => `🤝 You and ${m[1]} are now friends!`) ||
      r(/^🤝 (.+?) прийняв вашу заявку у друзі!$/,
        m => `🤝 ${m[1]} accepted your friend request!`) ||
      r(/^Ви вже дружите з (.+?)!$/,
        m => `You are already friends with ${m[1]}!`) ||
      r(/^Заявку гравцю (.+?) вже надіслано\.$/,
        m => `Friend request to ${m[1]} was already sent.`) ||
      r(/^Ви видалили (.+?) зі списку друзів\.$/,
        m => `Removed ${m[1]} from friends list.`) ||
      r(/^Ви приєдналися до кімнати.*/,
        () => 'Joined room.') ||
      r(/^🚩 Скаргу на (.+?) надіслано модераторам\.$/,
        m => `🚩 Report on ${m[1]} sent to moderators.`) ||
      r(/^⚠️ Попередження від модератора \(-10 карми\)! Причина: (.+)$/,
        m => `⚠️ Moderator warning (-10 karma)! Reason: ${m[1]}`) ||
      r(/^⚠️ Гравцю (.+?) видано попередження \(-10 карми\)\.$/,
        m => `⚠️ Issued warning (-10 karma) to ${m[1]}.`) ||
      r(/^🔇 Вам видано мут чату на (.+?)! Причина: (.+)$/,
        m => `🔇 You were muted for ${m[1]}! Reason: ${m[2]}`) ||
      r(/^🔇 Гравцю (.+?) видано мут на (.+?)\.$/,
        m => `🔇 Muted ${m[1]} for ${m[2]}.`) ||
      r(/^🚫 Вам заборонено грати \((.+?)\)\. Спілкування у чатах та з друзями залишається доступним! Причина: (.+)$/,
        m => `🚫 You are play-banned (${m[1]}). Chatting with friends remains available! Reason: ${m[2]}`) ||
      r(/^🎮 Гравцю (.+?) заборонено грати \((.+?)\)\.$/,
        m => `🎮 Play-banned ${m[1]} (${m[2]}).`) ||
      r(/^⏳ Ваш акаунт тимчасово заблоковано на (.+?)\. Причина: (.+)$/,
        m => `⏳ Your account is temporarily banned for ${m[1]}. Reason: ${m[2]}`) ||
      r(/^⏳ Гравцю (.+?) видано бан на (.+?)\.$/,
        m => `⏳ Banned ${m[1]} for ${m[2]}.`) ||
      r(/^🚫 Ваш акаунт заблоковано назавжди\. Причина: (.+)$/,
        m => `🚫 Your account is permanently banned. Reason: ${m[1]}`) ||
      r(/^🚫 Гравця (.+?) заблоковано назавжди\.$/,
        m => `🚫 Permanently banned ${m[1]}.`) ||
      r(/^🔊 Мут з гравця (.+?) успішно знято\.$/,
        m => `🔊 Unmuted ${m[1]} successfully.`) ||
      r(/^🎮 Заборону на гру з (.+?) успішно знято\.$/,
        m => `🎮 Lifted play-ban from ${m[1]} successfully.`) ||
      r(/^🔓 Бан з гравця (.+?) успішно знято\.$/,
        m => `🔓 Unbanned ${m[1]} successfully.`) ||
      r(/^Додано ботів: (\d+) шт\.$/,
        m => `Added ${m[1]} bots.`) ||
      r(/^Характер ботів змінено на: (.+)$/,
        m => `Bot personality changed to: ${m[1]}`) ||
      r(/^Бот (.+?) написав у чат\.$/,
        m => `Bot ${m[1]} sent a chat message.`) ||
      r(/^Бот (.+?) проголосував проти (.+?)\.$/,
        m => `Bot ${m[1]} voted against ${m[2]}.`) ||
      r(/^❌ Гравця «(.+?)» не знайдено!$/,
        m => `❌ Player "${m[1]}" not found!`) ||
      r(/^✅ Нараховано гравцю (.+?): \+(.+?) 🪙, \+(.+?) 💎, \+(.+?) ⭐, \+(.+?) XP!$/,
        m => `✅ Granted to ${m[1]}: +${m[2]} 🪙, +${m[3]} 💎, +${m[4]} ⭐, +${m[5]} XP!`) ||
      r(/^🚫 Гравець (.+?) заблокований!$/,
        m => `🚫 Player ${m[1]} has been banned!`) ||
      r(/^Помилка перевірки Google-акаунта: (.+)$/,
        m => `Google account verification error: ${m[1]}`) ||
      r(/^до (.+)$/,
        m => `until ${m[1]}`) ||
      r(/^🚫 Цей акаунт заблоковано назавжди\.(.*)$/,
        m => `🚫 This account is permanently banned.${m[1] ? ' Reason:' + m[1].replace(' Причина:', '') : ''}`) ||
      r(/^⏳ Акаунт тимчасово заблоковано до (.+?)\.(.*)$/,
        m => `⏳ Account temporarily banned until ${m[1]}.${m[2] ? ' Reason:' + m[2].replace(' Причина:', '') : ''}`) ||
      r(/^Потрібна карма (\d+)\+ для входу в цю кімнату!$/,
        m => `Requires ${m[1]}+ karma to enter this room!`) ||
      r(/^🎁 (.+?) ➔ (.+?): (.+)$/,
        m => `🎁 ${m[1]} ➔ ${m[2]}: ${m[3]}`) ||
      r(/^❌ Недостатньо монет! Потрібно (\d+) 🪙 \(25 🪙 × (\d+)\), а у вас (\d+) 🪙\.$/,
        m => `❌ Not enough coins! Need ${m[1]} 🪙 (25 🪙 × ${m[2]}), you have ${m[3]} 🪙.`) ||
      r(/^🤖 (.+?) додав до столу (\d+) бот\(ів\): (.+)\.$/,
        m => `🤖 ${m[1]} added ${m[2]} bot(s) to the table: ${m[3]}.`) ||
      r(/^🤖 Додано (\d+) бот\(ів\) за (\d+) 🪙!$/,
        m => `🤖 Added ${m[1]} bot(s) for ${m[2]} 🪙!`) ||
      r(/^🤖 Безкоштовно додано (\d+) бот\(ів\)!$/,
        m => `🤖 Added ${m[1]} bot(s) for free!`) ||
      r(/^⚠️ Неактивні \/ вийшли достроково: (.+?)\. Ви можете подати скаргу або зняти 3 карми!$/,
        m => `⚠️ Inactive / left early: ${m[1]}. You can report or deduct 3 karma!`) ||
      r(/^Ви вже зняли карму з (.+?) за цю гру\.$/,
        m => `You already penalized ${m[1]}'s karma for this match.`) ||
      r(/^📉 Гравець (.+?) зняв вам -3 карми за достроковий вихід \/ неактивність у матчі «(.+?)»\.$/,
        m => `📉 ${m[1]} deducted -3 karma from you for leaving early / AFK in "${m[2]}".`) ||
      r(/^📉 З гравця (.+?) знято 3 карми за достроковий вихід!$/,
        m => `📉 Deducted 3 karma from ${m[1]} for leaving early!`) ||
      r(/^🧪 Гравця (.+?) призначено Тестером \(\+10 000 🪙, \+1 000 ⭐, \+(?:50|250) 💎, VIP\)!$/,
        m => `🧪 ${m[1]} appointed Tester (+10,000 🪙, +1,000 ⭐, +250 💎, VIP)!`) ||
      r(/^🧪 Статус Тестера знято з (.+?)\.$/,
        m => `🧪 Tester status removed from ${m[1]}.`) ||
      r(/^🤝 Гравця (.+?) призначено Братіком! Йому надіслано вікно створення особистого секретного коду\.$/,
        m => `🤝 ${m[1]} appointed Bratik! Secret code setup prompt sent.`) ||
      r(/^🤝 Посаду Братіка знято з (.+?)\.$/,
        m => `🤝 Bratik rank removed from ${m[1]}.`) ||
      r(/^🛡️ Гравцю (.+?) призначено роль персоналу: (.+?)\.$/,
        m => `🛡️ Assigned staff role to ${m[1]}: ${m[2]}.`) ||
      r(/^✅ Новий пароль для (.+?) підтверджено та активовано!$/,
        m => `✅ New password for ${m[1]} approved and activated!`) ||
      r(/^❌ Запит на скидання пароля для (.+?) відхилено\.$/,
        m => `❌ Password reset request for ${m[1]} rejected.`) ||
      r(/^↩️ Скасовано вердикт по скарзі (.+?) \(ціль: (.+?)\)\.$/,
        m => `↩️ Reverted verdict on report ${m[1]} (target: ${m[2]}).`) ||
      r(/^↩️ Скасовано дію щодо (.+?)\.$/,
        m => `↩️ Reverted action against ${m[1]}.`) ||
      raw
    );
  };

  window.t = function (key, fallback) {
    const dict = I18N_DICT[window.currentLang] || I18N_DICT.ua;
    if (dict[key] !== undefined) return dict[key];
    if (I18N_DICT.ua[key] !== undefined) return I18N_DICT.ua[key];
    return fallback !== undefined ? fallback : key;
  };

  window.applyLanguage = function (lang) {
    window.currentLang = lang === 'en' ? 'en' : 'ua';
    localStorage.setItem('mafia_lang', window.currentLang);
    document.documentElement.lang = window.currentLang === 'en' ? 'en' : 'uk';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = window.t(key, el.textContent);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = window.t(key, el.innerHTML);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = window.t(key, el.placeholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.title = window.t(key, el.title);
    });

    const uaBtn = document.getElementById('langUaBtn');
    const enBtn = document.getElementById('langEnBtn');
    if (uaBtn) uaBtn.classList.toggle('active', window.currentLang === 'ua');
    if (enBtn) enBtn.classList.toggle('active', window.currentLang === 'en');
    const authUaBtn = document.getElementById('authLangUaBtn');
    const authEnBtn = document.getElementById('authLangEnBtn');
    if (authUaBtn) authUaBtn.classList.toggle('active', window.currentLang === 'ua');
    if (authEnBtn) authEnBtn.classList.toggle('active', window.currentLang === 'en');
    const sel = document.getElementById('uiLangSelect');
    if (sel) sel.value = window.currentLang;

    if (typeof window.onLanguageChanged === 'function') {
      window.onLanguageChanged(window.currentLang);
    }
  };
  window.I18N_DICT = I18N_DICT;

  document.addEventListener('DOMContentLoaded', () => {
    window.applyLanguage(window.currentLang);
  });
})();
