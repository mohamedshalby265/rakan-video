import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';

final tts = FlutterTts();

bool _engineSet = false;

Future<String?> say(String t,
    {String lang = 'ar', double pitch = 1.7, double rate = 0.4}) async {
  try {
    if (!_engineSet) {
      _engineSet = true;
      try {
        await tts.setEngine('com.google.android.tts');
      } catch (_) {}
    }
    await tts.stop();
    final ok = await tts.isLanguageAvailable(lang);
    if (ok != true) {
      return 'مفيش صوت للغة دي على الموبايل. نزّل Speech Services by Google من متجر Play وحمّل اللغة';
    }
    await tts.setLanguage(lang);
    await tts.setVolume(1.0);
    await tts.setPitch(pitch);
    await tts.setSpeechRate(rate);
    await tts.speak(t);
    return null;
  } catch (e) {
    return 'حصلت مشكلة في الصوت: $e';
  }
}

class Item {
  final String big, label, speak, lang;
  final Color? color;
  const Item(this.big, this.label, this.speak, this.lang, [this.color]);
}

List<Item> parse(List<String> l, [String lang = 'ar']) => l.map((e) {
      final p = e.split('|');
      return Item(p[0], p[1], p.length > 2 ? p[2] : p[1], lang);
    }).toList();

final colors = [
  'ff0000|أحمر', 'ffd400|أصفر', '1e88e5|أزرق', '2e7d32|أخضر',
  'ff8c00|برتقالي', '8e24aa|بنفسجي', 'ff69b4|وردي', '000000|أسود',
  'ffffff|أبيض', '795548|بني',
].map((e) {
  final p = e.split('|');
  return Item('', p[1], p[1], 'ar', Color(int.parse('ff${p[0]}', radix: 16)));
}).toList();

final arLetters = parse([
  'أ|ألف', 'ب|باء', 'ت|تاء', 'ث|ثاء', 'ج|جيم', 'ح|حاء', 'خ|خاء',
  'د|دال', 'ذ|ذال', 'ر|راء', 'ز|زاي', 'س|سين', 'ش|شين', 'ص|صاد',
  'ض|ضاد', 'ط|طاء', 'ظ|ظاء', 'ع|عين', 'غ|غين', 'ف|فاء', 'ق|قاف',
  'ك|كاف', 'ل|لام', 'م|ميم', 'ن|نون', 'ه|هاء', 'و|واو', 'ي|ياء',
]);

final enLetters = () {
  final w = 'apple ball cat dog egg fish goat hat igloo juice kite lion moon nose orange pig queen rabbit sun tree umbrella van water xylophone yellow zebra'
      .split(' ');
  return [
    for (var i = 0; i < 26; i++)
      Item(
          '${String.fromCharCode(65 + i)}${String.fromCharCode(97 + i)}',
          w[i],
          '${String.fromCharCode(65 + i)}. ${w[i]}',
          'en-US')
  ];
}();

final words = parse([
  '🚪|باب', '🦆|بطة', '🐱|قطة', '🐪|جمل', '☀️|شمس', '🌙|قمر', '💧|ماء',
  '🍞|خبز', '🍎|تفاحة', '🐟|سمكة', '🌳|شجرة', '🏠|بيت', '📖|كتاب',
  '🚗|سيارة', '⚽|كرة', '🌹|وردة',
]);

final sentences = [
  ...parse([
    '🐱|هذه قطة', '🍎|أنا آكل تفاحة', '💧|أنا أشرب الماء',
    '☀️|الشمس جميلة', '📖|هذا كتاب', '👋|السلام عليكم',
    '🌅|صباح الخير', '🙏|شكرًا', '🤲|من فضلك', '🚪|مع السلامة',
    '❤️|أنا أحب ماما',
  ]),
  ...parse([
    '👋|Hello', '🌅|Good morning', '🙏|Thank you', '❤️|I love you',
    '🍎|I like apples',
  ], 'en-US'),
];

final islam = parse([
  '☝️|الله واحد', '🕌|أنا مسلم', '❤️|نحب الله ونحب النبي',
  '🤲|بسم الله', '🍽️|الحمد لله', '🕋|الله أكبر', '👋|السلام عليكم',
  '1️⃣|الشهادتان|الركن الأول، الشهادتان',
  '2️⃣|الصلاة|الركن الثاني، الصلاة',
  '3️⃣|الزكاة|الركن الثالث، الزكاة',
  '4️⃣|صوم رمضان|الركن الرابع، صوم رمضان',
  '5️⃣|حج البيت|الركن الخامس، حج البيت',
]);

class Cat {
  final String icon, title;
  final List<Item> items;
  final int cols;
  final double ratio, big;
  Cat(this.icon, this.title, this.items, this.cols, this.ratio, this.big);
}

final cats = [
  Cat('🎨', 'الألوان', colors, 2, 1.4, 0),
  Cat('أ', 'الحروف العربية', arLetters, 4, 1, 44),
  Cat('A', 'English Letters', enLetters, 3, 1, 40),
  Cat('📖', 'كلمات', words, 3, 1, 44),
  Cat('💬', 'جمل', sentences, 1, 3, 30),
  Cat('🕌', 'ديني', islam, 2, 1.3, 36),
  Cat('🧍', 'جسمي', parse(['👁️|عين', '👂|أذن', '👃|أنف', '👄|فم', '✋|يد', '🦶|قدم', '🦷|سن']), 3, 1, 44),
  Cat('🐱', 'حيوانات', parse(['🐱|قطة', '🐶|كلب', '🐮|بقرة', '🐑|خروف', '🐔|دجاجة', '🐴|حصان', '🦁|أسد', '🐘|فيل']), 3, 1, 44),
  Cat('🔢', 'أرقام', parse(['1|واحد', '2|اثنان', '3|ثلاثة', '4|أربعة', '5|خمسة', '6|ستة', '7|سبعة', '8|ثمانية', '9|تسعة', '10|عشرة']), 3, 1, 44),
  Cat('⏰', 'روتيني', parse(['🧼|نغسل أيدينا', '🍽️|نأكل', '💧|نشرب ماء', '🪥|ننظف أسناننا', '👕|نلبس ملابسنا', '🛁|نستحم', '😴|ننام']), 2, 1.2, 44),
  Cat('🍎', 'فواكه', parse(['🍎|تفاحة', '🍌|موزة', '🍇|عنب', '🍊|برتقالة', '🍓|فراولة', '🍉|بطيخ', '🍐|كمثرى']), 3, 1, 44),
  Cat('👨‍👩‍👧', 'أسرتي', parse(['👨|بابا', '👩|ماما', '👶|بيبي', '👴|جدو', '👵|تيتة', '👦|أخي', '👧|أختي']), 3, 1, 44),
];

const pal = [
  Color(0xFF3949AB), Color(0xFF00897B), Color(0xFFF4511E),
  Color(0xFF8E24AA), Color(0xFF039BE5), Color(0xFFC0CA33),
];

class GamesMenu extends StatelessWidget {
  const GamesMenu({super.key});
  @override
  Widget build(BuildContext context) => GridView.count(
        crossAxisCount: 3,
        padding: const EdgeInsets.all(10),
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        children: [
          for (final c in cats)
            InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => TapGrid(c))),
              child: Ink(
                decoration: BoxDecoration(
                    color: Colors.white10,
                    borderRadius: BorderRadius.circular(18)),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(c.icon, style: const TextStyle(fontSize: 38)),
                    const SizedBox(height: 4),
                    Text(c.title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
        ],
      );
}

class TapGrid extends StatelessWidget {
  final Cat cat;
  const TapGrid(this.cat, {super.key});

  Widget card(BuildContext ctx, Item it, int i) {
    final bg = it.color ?? pal[i % pal.length];
    final fg = bg.computeLuminance() > 0.6 ? Colors.black : Colors.white;
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () async {
        final e = await say(it.speak, lang: it.lang);
        if (e != null && ctx.mounted) {
          ScaffoldMessenger.of(ctx)
              .showSnackBar(SnackBar(content: Text(e)));
        }
      },
      child: Ink(
        decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.white24)),
        child: Center(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Padding(
              padding: const EdgeInsets.all(6),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                if (it.big.isNotEmpty)
                  Text(it.big,
                      style: TextStyle(
                          fontSize: cat.big,
                          color: fg,
                          fontWeight: FontWeight.w900)),
                if (it.label.isNotEmpty)
                  Text(it.label,
                      style: TextStyle(
                          fontSize: 20,
                          color: fg,
                          fontWeight: FontWeight.bold)),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(cat.title)),
        body: GridView.count(
          crossAxisCount: cat.cols,
          childAspectRatio: cat.ratio,
          padding: const EdgeInsets.all(10),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          children: [
            for (var i = 0; i < cat.items.length; i++) card(context, cat.items[i], i)
          ],
        ),
      );
}
