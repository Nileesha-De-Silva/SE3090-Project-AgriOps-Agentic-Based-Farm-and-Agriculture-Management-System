import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'api.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});
  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}
class _ScannerScreenState extends State<ScannerScreen> {
  bool finished = false;
  String? error;
  final manual = TextEditingController();
  void accept(String value) {
    if (finished) return;
    final id = itemIdFromCode(value);
    if (id == null) { setState(() => error = 'Scan an AgriOps item label or enter a valid inventory ID.'); return; }
    finished = true;
    Navigator.of(context).pop(id);
  }
  @override
  void dispose() { manual.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Scan inventory label')),
    body: SafeArea(child: ListView(padding: const EdgeInsets.all(20), children: [
      const Text('Point your camera at an item QR code. Labels contain agriops:item:<inventory ID>.'),
      const SizedBox(height: 16), SizedBox(height: 280, child: MobileScanner(
        onDetect: (capture) { for (final barcode in capture.barcodes) { if (barcode.rawValue != null) { accept(barcode.rawValue!); break; } } },
        errorBuilder: (context, error) => const Center(child: Text('Camera unavailable or permission denied. Enter the item ID below.')),
      )),
      const SizedBox(height: 20), TextField(controller: manual, decoration: const InputDecoration(labelText: 'Inventory ID (manual fallback)')),
      if (error != null) Text(error!),
      FilledButton(onPressed: () => accept(manual.text), child: const Text('Open item')),
    ])));
}
