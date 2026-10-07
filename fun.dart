import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'games.dart';

const bColors = [
  Color(0xFFE53935), Color(0xFFFDD835), Color(0xFF1E88E5), Color(0xFF43A047),
  Color(0xFFFB8C00), Color(0xFF8E24AA), Color(0xFFEC407A),
];
const bNames = ['أحمر', 'أصفر', 'أزرق', 'أخضر', 'برتقالي', 'بنفسجي', 'وردي'];

class _B {
  double x, y, speed;
  int c;
  _B(this.x, this.y, this.speed, this.c);
}

class BalloonsGame extends StatefulWidget {
  const BalloonsGame({super.key});
  @override
  State<BalloonsGame> createState() => _BalloonsState();
}

class _BalloonsState extends State<BalloonsGame>
    with SingleTickerProviderStateMixin {
  final rnd = Random();
  late final AnimationController ctl;
  final bl = <_B>[];

  _B spawn(bool initial) => _B(rnd.nextDouble(),
      initial ? rnd.nextDouble() : 1.1, 0.002 + rnd.nextDouble() * 0.002,
      rnd.nextInt(bColors.length));

  @override
  void initState() {
    super.initState();
    for (var i = 0; i < 6; i++) {
      bl.add(spawn(true));
    }
    ctl = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..addListener(() {
        setState(() {
          for (var i = 0; i < bl.length; i++) {
            bl[i].y -= bl[i].speed;
            if (bl[i].y < -0.25) bl[i] = spawn(false);
          }
        });
      })
      ..repeat();
  }

  @override
  void dispose() {
    ctl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFFD6ECFA),
        appBar: AppBar(title: const Text('بلالين')),
        body: LayoutBuilder(builder: (context, cs) {
          final w = cs.maxWidth, h = cs.maxHeight;
          return Stack(children: [
            for (var i = 0; i < bl.length; i++)
              Positioned(
                left: bl[i].x * (w - 90),
                top: bl[i].y * h,
                child: GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    say(bNames[bl[i].c]);
                    setState(() => bl[i] = spawn(false));
                  },
                  child: Column(children: [
                    Container(
                      width: 90,
                      height: 110,
                      decoration: BoxDecoration(
                        color: bColors[bl[i].c],
                        borderRadius:
                            const BorderRadius.all(Radius.elliptical(45, 55)),
                      ),
                    ),
                    Container(width: 2, height: 30, color: Colors.black38),
                  ]),
                ),
              ),
          ]);
        }),
      );
}

class _Stroke {
  final Color c;
  final List<Offset> pts;
  _Stroke(this.c, this.pts);
}

class _Painter extends CustomPainter {
  final List<_Stroke> s;
  _Painter(this.s);
  @override
  void paint(Canvas canvas, Size size) {
    for (final st in s) {
      final p = Paint()
        ..color = st.c
        ..strokeWidth = 14
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
      if (st.pts.length == 1) {
        canvas.drawCircle(st.pts.first, 7, p..style = PaintingStyle.fill);
      } else {
        final path = Path()..moveTo(st.pts.first.dx, st.pts.first.dy);
        for (final o in st.pts.skip(1)) {
          path.lineTo(o.dx, o.dy);
        }
        canvas.drawPath(path, p);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _Painter old) => true;
}

class DrawGame extends StatefulWidget {
  const DrawGame({super.key});
  @override
  State<DrawGame> createState() => _DrawState();
}

class _DrawState extends State<DrawGame> {
  final strokes = <_Stroke>[];
  Color color = bColors[0];
  Offset? pen;
  static const palette = [
    Color(0xFFE53935), Color(0xFFFDD835), Color(0xFF1E88E5),
    Color(0xFF43A047), Color(0xFF8E24AA), Color(0xFFFB8C00), Colors.white,
  ];

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('رسم'), actions: [
          IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: () => setState(() => strokes.clear())),
        ]),
        body: Column(children: [
          Expanded(
            child: Container(
              color: Colors.white,
              child: Stack(children: [
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onPanStart: (d) => setState(() {
                    strokes.add(_Stroke(color, [d.localPosition]));
                    pen = d.localPosition;
                  }),
                  onPanUpdate: (d) => setState(() {
                    strokes.last.pts.add(d.localPosition);
                    pen = d.localPosition;
                  }),
                  onPanEnd: (_) => setState(() => pen = null),
                  child: SizedBox.expand(
                      child: CustomPaint(painter: _Painter(strokes))),
                ),
                if (pen != null)
                  Positioned(
                    left: pen!.dx - 6,
                    top: pen!.dy - 44,
                    child: const IgnorePointer(
                        child: Text('✏️', style: TextStyle(fontSize: 40))),
                  ),
              ]),
            ),
          ),
          Container(
            color: const Color(0xFF0E0E10),
            padding: const EdgeInsets.all(10),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
              for (final c in palette)
                GestureDetector(
                  onTap: () => setState(() => color = c),
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: c,
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: color == c ? Colors.amber : Colors.white24,
                          width: color == c ? 4 : 1),
                    ),
                  ),
                ),
            ]),
          ),
        ]),
      );
}

class RaceGame extends StatefulWidget {
  const RaceGame({super.key});
  @override
  State<RaceGame> createState() => _RaceState();
}

class _RaceState extends State<RaceGame> {
  double pos = 0;
  bool done = false;

  Future<void> go() async {
    if (done) return;
    HapticFeedback.selectionClick();
    setState(() => pos += 0.07);
    if (pos >= 1) {
      setState(() => done = true);
      say('برافو');
      await Future.delayed(const Duration(seconds: 2));
      if (!mounted) return;
      setState(() {
        pos = 0;
        done = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('سباق')),
        body: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: go,
          child: LayoutBuilder(builder: (context, cs) {
            final track = cs.maxHeight - 150;
            return Stack(children: [
              Container(color: const Color(0xFF37474F)),
              Center(child: Container(width: 6, color: Colors.white24)),
              const Positioned(
                  top: 8,
                  left: 0,
                  right: 0,
                  child: Center(
                      child: Text('🏁', style: TextStyle(fontSize: 60)))),
              AnimatedPositioned(
                duration: const Duration(milliseconds: 200),
                bottom: 40 + pos.clamp(0.0, 1.0) * track,
                left: 0,
                right: 0,
                child: const Center(
                    child: Text('🚗', style: TextStyle(fontSize: 72))),
              ),
              if (done)
                const Center(
                    child: Text('🎉 برافو 🎉', style: TextStyle(fontSize: 42))),
              const Positioned(
                bottom: 8,
                left: 0,
                right: 0,
                child: Center(child: Text('اضغط عشان العربية تمشي')),
              ),
            ]);
          }),
        ),
      );
}

class ColorQuiz extends StatefulWidget {
  const ColorQuiz({super.key});
  @override
  State<ColorQuiz> createState() => _QuizState();
}

class _QuizState extends State<ColorQuiz> {
  final rnd = Random();
  List<int> opts = [];
  int target = 0;
  String msg = '';

  @override
  void initState() {
    super.initState();
    next();
  }

  void next() {
    final all = List.generate(bColors.length, (i) => i)..shuffle(rnd);
    opts = all.take(3).toList();
    target = opts[rnd.nextInt(3)];
    msg = '';
    Future.delayed(const Duration(milliseconds: 500),
        () => say('فين اللون ${bNames[target]}'));
  }

  Future<void> tap(int c) async {
    if (c == target) {
      setState(() => msg = '🎉 برافو');
      await say('برافو');
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) setState(next);
    } else {
      setState(() => msg = '🙂 حاول تاني');
      say('حاول تاني');
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('لعبة الألوان')),
        body: Center(
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('فين اللون ${bNames[target]}؟',
                style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900)),
            const SizedBox(height: 30),
            Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
              for (final c in opts)
                GestureDetector(
                  onTap: () => tap(c),
                  child: Container(
                    width: 96,
                    height: 96,
                    decoration:
                        BoxDecoration(color: bColors[c], shape: BoxShape.circle),
                  ),
                ),
            ]),
            const SizedBox(height: 30),
            Text(msg, style: const TextStyle(fontSize: 30)),
          ]),
        ),
      );
}
