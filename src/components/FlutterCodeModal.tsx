import React, { useState } from 'react';
import { Copy, Check, X, Smartphone, Flame, Code } from 'lucide-react';

interface FlutterCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlutterCodeModal: React.FC<FlutterCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const flutterDartCode = `import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const FreeFireRedeemApp());
}

class FreeFireRedeemApp extends StatelessWidget {
  const FreeFireRedeemApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Free Fire Voucher Vault',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        primarySwatch: Colors.amber,
      ),
      home: const RedeemCodeScreen(userId: 'FF_89210491'),
    );
  }
}

class RedeemCodeScreen extends StatefulWidget {
  final String userId; // Free Fire Player UID
  const RedeemCodeScreen({super.key, required this.userId});

  @override
  State<RedeemCodeScreen> createState() => _RedeemCodeScreenState();
}

class _RedeemCodeScreenState extends State<RedeemCodeScreen> {
  final TextEditingController _codeController = TextEditingController();
  bool _isLoading = false;
  int _diamondBalance = 850;

  /// IN-APP NOTIFICATION SYSTEM:
  /// Uses ScaffoldMessenger to show floating animated SnackBars
  void _showNotification({
    required String message,
    required bool isSuccess,
    String? rewardDetail,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    // Clear prior active SnackBars to prevent queue delays
    ScaffoldMessenger.of(context).hideCurrentSnackBar();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        elevation: 8,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isSuccess ? const Color(0xFF10B981) : const Color(0xFFEF4444),
            width: 1.2,
          ),
        ),
        backgroundColor: const Color(0xFF1E293B),
        duration: const Duration(seconds: 4),
        content: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSuccess ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isSuccess ? Icons.verified : Icons.error_outline,
                color: isSuccess ? const Color(0xFF34D399) : const Color(0xFFF87171),
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isSuccess ? 'Reward Claimed!' : 'Redemption Failed',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    message,
                    style: const TextStyle(fontSize: 12, color: Color(0xFFCBD5E1)),
                  ),
                  if (rewardDetail != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      rewardDetail,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        color: Color(0xFF34D399),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        action: actionLabel != null
            ? SnackBarAction(
                label: actionLabel,
                textColor: isSuccess ? const Color(0xFF34D399) : Colors.amber,
                onPressed: onAction ?? () {},
              )
            : null,
      ),
    );
  }

  Future<void> redeemCode() async {
    final code = _codeController.text.trim().toUpperCase();
    if (code.isEmpty) {
      _showNotification(
        message: 'Please enter a 12-16 character Free Fire serial code.',
        isSuccess: false,
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse('https://your-api-domain.com/api/redeem'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': widget.userId,
          'code': code,
        }),
      );

      final data = jsonDecode(response.body);
      final bool isSuccess = (response.statusCode == 200) && (data['success'] == true);
      final String message = data['message'] ?? 'An error occurred during redemption.';

      if (isSuccess) {
        final int reward = data['reward'] ?? 0;
        final String rewardItem = data['codeData']?['reward_item'] ?? '+$reward Diamonds 💎';

        setState(() {
          _diamondBalance += reward;
          _codeController.clear();
        });

        // Trigger Success SnackBar
        _showNotification(
          message: message,
          rewardDetail: rewardItem,
          isSuccess: true,
          actionLabel: 'VIEW VAULT',
          onAction: () {
            // Navigate to inventory / vault
          },
        );
      } else {
        // Trigger Error SnackBar with server message (e.g., Expired, Limit reached, Already claimed)
        _showNotification(
          message: message,
          isSuccess: false,
          actionLabel: 'RETRY',
        );
      }
    } catch (e) {
      _showNotification(
        message: 'Network connection failure. Check server status.',
        isSuccess: false,
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Free Fire Voucher Vault'),
        centerTitle: true,
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Vault Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'UID: \${widget.userId}',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.diamond, color: Colors.cyanAccent, size: 28),
                      const SizedBox(width: 8),
                      Text(
                        '$_diamondBalance Diamonds',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Input Form
            TextField(
              controller: _codeController,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                labelText: 'Enter Free Fire Serial Voucher',
                hintText: 'e.g. FFIC-DCTS-L5FT',
                prefixIcon: const Icon(Icons.card_giftcard, color: Colors.amber),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: 16),

            ElevatedButton(
              onPressed: _isLoading ? null : redeemCode,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                    )
                  : const Text(
                      'Redeem Free Fire Reward',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(flutterDartCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Flutter In-App Notification (SnackBar) Implementation</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready to Copy
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Shows how to invoke floating <code className="text-white font-mono">ScaffoldMessenger.of(context).showSnackBar()</code> with Free Fire rewards.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 flex-1 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
            <span className="flex items-center gap-1.5 text-xs text-slate-300">
              <Code className="w-3.5 h-3.5 text-amber-400" />
              <span>lib/redeem_code_screen.dart</span>
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Dart Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="overflow-x-auto leading-relaxed text-[11px] text-slate-300">
            <code>{flutterDartCode}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Includes floating styling, reward detail row, and retry/vault actions.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
