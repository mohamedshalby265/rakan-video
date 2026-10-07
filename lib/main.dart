import 'dart:async';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:video_player/video_player.dart';
import 'games.dart';

const secs = [
  ['videos', 'فيديوهات'],
  ['photos', 'صور'],
  ['songs', 'أغاني'],
  ['quran', 'قرآن'],
  ['games', 'ألعاب'],
];
const emojis = ['🎬', '📷', '🎵', '📖', '🎮'];
const tileColors = [
  Color(0xFF85B7EB), Color(0xFF5DCAA5), Color(0xFFF0997B),
  Color(0xFF97C459), Color(0xFFAFA9EC),
];
const vExt = ['mp4', 'mkv', 'mov', 'webm', '3gp', 'm4v'];
const aExt = ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'opus'];
const iExt = ['jpg', 'jpeg', 'png', 'webp'];

class Settings {
  static late SharedPreferences p;
  static Future<void> init() async => p = await SharedPreferences.getInstance();
  static String get pin => p.getString('pin') ?? '1234';
  static String get name => p.getString('name') ?? 'راكان';
  static int get minutes => p.getInt('minutes') ?? 15;
  static String? get logo => p.getString('logo');
  static String? folder(String k) => p.getString('f_$k');
  static bool hidden(String k) => p.getBool('h_$k') ?? false;
}

Future<List<File>> listFiles(String? dir, List<String> ext) async {
  if (dir == null) return [];
  try {
    final d = Directory(dir);
    if (!await d.exists()) return [];
    return d
        .listSync()
        .whereType<File>()
        .where((f) => ext.contains(f.path.split('.').last.toLowerCase()))
        .toList()
      ..sort((a, b) => a.path.compareTo(b.path));
  } catch (_) {
    return [];
  }
}

Widget logoImage(double size) {
  final p = Settings.logo;
  final img = (p != null && File(p).existsSync())
      ? Image.file(File(p), fit: BoxFit.cover)
      : Image.asset('assets/logo.png', fit: BoxFit.cover);
  return ClipOval(child: SizedBox(width: size, height: size, child: img));
}

Future<bool> askPin(BuildContext context) async {
  final c = TextEditingController();
  final ok = await showDialog<bool>(
    context: context,
    builder: (d) => AlertDialog(
      title: const Text('الرقم السري'),
      content: TextField(
          controller: c,
          obscureText: true,
          autofocus: true,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(d, false),
            child: const Text('إلغاء')),
        TextButton(
            onPressed: () => Navigator.pop(d, c.text == Settings.pin),
            child: const Text('دخول')),
      ],
    ),
  );
  return ok == true;
}

Future<String?> askText(BuildContext context, String title, String init) async {
  final c = TextEditingController(text: init);
  return showDialog<String>(
    context: context,
    builder: (d) => AlertDialog(
      title: Text(title),
      content: TextField(controller: c, autofocus: true),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(d), child: const Text('إلغاء')),
        TextButton(
            onPressed: () => Navigator.pop(d, c.text.trim()),
            child: const Text('حفظ')),
      ],
    ),
  );
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Settings.init();
  runApp(const App());
}

class App extends StatelessWidget {
  const App({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark(useMaterial3: true),
        home: const Splash(),
      );
}

class Splash extends StatefulWidget {
  const Splash({super.key});
  @override
  State<Splash> createState() => _SplashState();
}

class _SplashState extends State<Splash> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 500),
        () => say('راكان', pitch: 1.2, rate: 0.3));
    Timer(const Duration(milliseconds: 3200), () {
      if (!mounted) return;
      Navigator.pushReplacement(
          context, MaterialPageRoute(builder: (_) => const Home()));
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFFD6ECFA),
        body: Center(child: Image.asset('assets/logo.png', width: 280)),
      );
}

class Home extends StatefulWidget {
  const Home({super.key});
  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  Timer? timer;

  @override
  void initState() {
    super.initState();
    startTimer();
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  void startTimer() {
    timer?.cancel();
    if (Settings.minutes <= 0) return;
    timer = Timer(Duration(minutes: Settings.minutes), rest);
  }

  Future<void> rest() async {
    if (!mounted) return;
    await Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const RestPage()),
        (r) => r.isFirst);
    startTimer();
  }

  Future<void> mom() async {
    if (!await askPin(context)) return;
    if (!mounted) return;
    timer?.cancel();
    await Navigator.push(
        context, MaterialPageRoute(builder: (_) => const MomPage()));
    if (mounted) {
      setState(() {});
      startTimer();
    }
  }

  Future<void> open(int i) async {
    await say(secs[i][1]).timeout(const Duration(seconds: 3), onTimeout: () => null);
    if (!mounted) return;
    Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => i == 4 ? const GamesPage() : FolderPage(i)));
  }

  @override
  Widget build(BuildContext context) {
    final shown = [
      for (var i = 0; i < secs.length; i++)
        if (!Settings.hidden(secs[i][0])) i
    ];
    return Scaffold(
      backgroundColor: const Color(0xFF0E0E10),
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              GestureDetector(onLongPress: mom, child: logoImage(52)),
              const SizedBox(width: 12),
              Text(Settings.name,
                  style: const TextStyle(
                      fontSize: 26, fontWeight: FontWeight.w900)),
            ]),
          ),
          Expanded(
            child: GridView.count(
              crossAxisCount: 2,
              padding: const EdgeInsets.all(12),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              children: [
                for (final i in shown)
                  InkWell(
                    borderRadius: BorderRadius.circular(28),
                    onTap: () => open(i),
                    child: Ink(
                      decoration: BoxDecoration(
                          color: tileColors[i],
                          borderRadius: BorderRadius.circular(28)),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(emojis[i], style: const TextStyle(fontSize: 54)),
                          const SizedBox(height: 6),
                          Text(secs[i][1],
                              style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.black87)),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(bottom: 6),
            child: Text('created by mohamed shalby',
                style: TextStyle(fontSize: 11, color: Colors.white38)),
          ),
        ]),
      ),
    );
  }
}

class RestPage extends StatefulWidget {
  const RestPage({super.key});
  @override
  State<RestPage> createState() => _RestPageState();
}

class _RestPageState extends State<RestPage> {
  Timer? t;
  static const msg = 'يلا يا حبيبي، اقفل التليفون وريّح عينيك شوية';

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 600), () => say(msg));
    t = Timer.periodic(const Duration(seconds: 30), (_) => say(msg));
  }

  @override
  void dispose() {
    t?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => PopScope(
        canPop: false,
        child: Scaffold(
          backgroundColor: const Color(0xFFD6ECFA),
          body: SafeArea(
            child: Stack(children: [
              Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  logoImage(150),
                  const SizedBox(height: 20),
                  const Text('😴', style: TextStyle(fontSize: 64)),
                  const SizedBox(height: 10),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 24),
                    child: Text('اقفل التليفون وريّح عينيك شوية',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: Colors.black87)),
                  ),
                ]),
              ),
              Align(
                alignment: Alignment.bottomRight,
                child: IconButton(
                  icon: const Icon(Icons.lock_outline, color: Colors.black38),
                  onPressed: () async {
                    if (await askPin(context) && context.mounted) {
                      Navigator.pop(context);
                    }
                  },
                ),
              ),
            ]),
          ),
        ),
      );
}

class GamesPage extends StatelessWidget {
  const GamesPage({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('ألعاب')), body: const GamesMenu());
}

class FolderPage extends StatefulWidget {
  final int sec;
  const FolderPage(this.sec, {super.key});
  @override
  State<FolderPage> createState() => _FolderPageState();
}

class _FolderPageState extends State<FolderPage> {
  List<File>? files;
  int current = 0;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    final ext = widget.sec == 1 ? iExt : [...vExt, ...aExt];
    final l = await listFiles(Settings.folder(secs[widget.sec][0]), ext);
    if (mounted) setState(() => files = l);
  }

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (files == null) {
      body = const Center(child: CircularProgressIndicator());
    } else if (files!.isEmpty) {
      body = const Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('🙈', style: TextStyle(fontSize: 70)),
          SizedBox(height: 8),
          Text('لسه مفيش حاجة هنا', style: TextStyle(fontSize: 22)),
        ]),
      );
    } else {
      body = PageView.builder(
        scrollDirection: Axis.vertical,
        itemCount: files!.length,
        onPageChanged: (i) => setState(() => current = i),
        itemBuilder: (_, i) => widget.sec == 1
            ? Image.file(files![i], fit: BoxFit.contain)
            : VideoPage(file: files![i], active: i == current),
      );
    }
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(children: [
          body,
          Positioned(
            top: 4,
            left: 4,
            child: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new),
                onPressed: () => Navigator.pop(context)),
          ),
        ]),
      ),
    );
  }
}

class VideoPage extends StatefulWidget {
  final File file;
  final bool active;
  const VideoPage({super.key, required this.file, required this.active});
  @override
  State<VideoPage> createState() => _VideoPageState();
}

class _VideoPageState extends State<VideoPage> {
  late final VideoPlayerController c;

  @override
  void initState() {
    super.initState();
    c = VideoPlayerController.file(widget.file);
    c.addListener(() {
      if (mounted) setState(() {});
    });
    c.setLooping(true);
    c.setVolume(1.0);
    c.initialize().then((_) {
      if (mounted && widget.active) c.play();
    });
  }

  @override
  void didUpdateWidget(VideoPage old) {
    super.didUpdateWidget(old);
    if (widget.active != old.active && c.value.isInitialized) {
      widget.active ? c.play() : c.pause();
    }
  }

  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  Future<void> seek(int s) async {
    final p = await c.position ?? Duration.zero;
    var t = p + Duration(seconds: s);
    if (t < Duration.zero) t = Duration.zero;
    if (t > c.value.duration) t = c.value.duration;
    await c.seekTo(t);
  }

  @override
  Widget build(BuildContext context) {
    if (!c.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }
    final playing = c.value.isPlaying;
    final audio = c.value.size.isEmpty;
    return Stack(alignment: Alignment.center, children: [
      if (audio)
        Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('🎵', style: TextStyle(fontSize: 100)),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(widget.file.path.split('/').last,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18)),
          ),
        ])
      else
        Center(
          child: AspectRatio(
              aspectRatio: c.value.aspectRatio, child: VideoPlayer(c)),
        ),
      Row(children: [
        Expanded(
            flex: 35,
            child: GestureDetector(
                behavior: HitTestBehavior.translucent,
                onDoubleTap: () => seek(-10))),
        const Spacer(flex: 30),
        Expanded(
            flex: 35,
            child: GestureDetector(
                behavior: HitTestBehavior.translucent,
                onDoubleTap: () => seek(10))),
      ]),
      IconButton(
        iconSize: 90,
        color: playing ? Colors.white24 : Colors.white70,
        icon: Icon(playing ? Icons.pause_circle : Icons.play_circle),
        onPressed: () => playing ? c.pause() : c.play(),
      ),
      Align(
        alignment: Alignment.bottomCenter,
        child: VideoProgressIndicator(c, allowScrubbing: false),
      ),
    ]);
  }
}

class MomPage extends StatefulWidget {
  const MomPage({super.key});
  @override
  State<MomPage> createState() => _MomPageState();
}

class _MomPageState extends State<MomPage> {
  void msg(String t) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t)));

  Future<void> pickFolder(int i) async {
    await [
      Permission.videos,
      Permission.photos,
      Permission.audio,
      Permission.storage
    ].request();
    final path = await FilePicker.platform.getDirectoryPath();
    if (path == null) return;
    await Settings.p.setString('f_${secs[i][0]}', path);
    final n = await listFiles(path, i == 1 ? iExt : [...vExt, ...aExt]);
    if (!mounted) return;
    setState(() {});
    msg(n.isEmpty
        ? 'مش لاقي ملفات هنا. اتأكد إن الفولدر فيه ملفات، وإن التطبيق واخد إذن الوصول للملفات'
        : 'لقيت ${n.length} ملف');
  }

  Future<void> changeLogo() async {
    final r = await FilePicker.platform.pickFiles(type: FileType.image);
    final src = r?.files.first.path;
    if (src == null) return;
    final dir = await getApplicationDocumentsDirectory();
    final dest = '${dir.path}/logo_${DateTime.now().millisecondsSinceEpoch}.png';
    await File(src).copy(dest);
    await Settings.p.setString('logo', dest);
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('وضع الأم')),
        body: ListView(children: [
          ListTile(
            leading: logoImage(40),
            title: const Text('اللوجو'),
            trailing: TextButton(
                onPressed: changeLogo, child: const Text('تغيير')),
          ),
          ListTile(
            title: const Text('الاسم'),
            subtitle: Text(Settings.name),
            trailing: const Icon(Icons.edit),
            onTap: () async {
              final t = await askText(context, 'اسم الطفل', Settings.name);
              if (t != null && t.isNotEmpty) {
                await Settings.p.setString('name', t);
                if (mounted) setState(() {});
              }
            },
          ),
          const Divider(),
          for (var i = 0; i < 4; i++)
            ListTile(
              leading: Text(emojis[i], style: const TextStyle(fontSize: 26)),
              title: Text('فولدر ${secs[i][1]}'),
              subtitle: Text(Settings.folder(secs[i][0]) ?? 'لسه ما اتحددش'),
              trailing: const Icon(Icons.folder_open),
              onTap: () => pickFolder(i),
            ),
          const Divider(),
          for (var i = 0; i < 5; i++)
            SwitchListTile(
              title: Text('إظهار ${secs[i][1]} للطفل'),
              value: !Settings.hidden(secs[i][0]),
              onChanged: (v) async {
                await Settings.p.setBool('h_${secs[i][0]}', !v);
                if (mounted) setState(() {});
              },
            ),
          const Divider(),
          ListTile(
            title: const Text('وقت الاستخدام قبل الراحة (دقيقة)'),
            subtitle: const Text('صفر = من غير وقت'),
            trailing: DropdownButton<int>(
              value: Settings.minutes,
              items: [
                for (final m in [0, 5, 10, 15, 20, 30, 45, 60])
                  DropdownMenuItem(value: m, child: Text('$m'))
              ],
              onChanged: (v) async {
                await Settings.p.setInt('minutes', v ?? 15);
                if (mounted) setState(() {});
              },
            ),
          ),
          ListTile(
            title: const Text('تغيير الرقم السري'),
            trailing: const Icon(Icons.key),
            onTap: () async {
              final t = await askText(context, 'الرقم السري الجديد', '');
              if (t != null && t.length >= 4) {
                await Settings.p.setString('pin', t);
                msg('اتغيّر الرقم السري');
              } else if (t != null) {
                msg('الرقم السري لازم يكون 4 أرقام على الأقل');
              }
            },
          ),
          const SizedBox(height: 24),
        ]),
      );
}
