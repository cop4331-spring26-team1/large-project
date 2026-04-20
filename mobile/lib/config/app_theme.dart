import 'package:flutter/material.dart';

class AppTheme {
  // ── Dark palette (matching web app) ──────────────────────────────────────
  static const Color bgDark        = Color(0xFF151829); // main scaffold
  static const Color bgCard        = Color(0xFF1E2340); // cards, panels, AppBar
  static const Color bgInput       = Color(0xFF252B4A); // input fields
  static const Color bgElevated    = Color(0xFF2C3357); // hover/elevated

  // Brand
  static const Color primary       = Color(0xFF4ECDC4); // teal
  static const Color primaryDark   = Color(0xFF38B2AA);
  static const Color primaryLight  = Color(0xFF1A3A39); // dark teal tint for bg

  // Status
  static const Color error         = Color(0xFFFF6B6B);
  static const Color success       = Color(0xFF34C759);
  static const Color warning       = Color(0xFFFFE66D);
  static const Color accent        = Color(0xFF6C63FF);

  // Text
  static const Color textPrimary   = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted     = Color(0xFF64748B);
  static const Color textLight     = Color(0xFF64748B);

  // Borders / dividers
  static const Color border        = Color(0xFF2D3561);
  static const Color divider       = Color(0xFF2D3561);
  static const Color surface       = Color(0xFF151829); // alias for bgDark

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary:   primary,
      secondary: primary,
      surface:   bgCard,
      error:     error,
    ),
    fontFamily: 'Inter',
    scaffoldBackgroundColor: bgDark,

    appBarTheme: const AppBarTheme(
      backgroundColor: bgCard,
      elevation: 0,
      scrolledUnderElevation: 0,
      iconTheme: IconThemeData(color: textPrimary),
      titleTextStyle: TextStyle(
        color: textPrimary,
        fontSize: 18,
        fontWeight: FontWeight.w700,
        fontFamily: 'Inter',
      ),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        disabledBackgroundColor: bgElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
        textStyle: const TextStyle(
            fontSize: 15, fontWeight: FontWeight.w600, fontFamily: 'Inter'),
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primary,
        side: const BorderSide(color: primary),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),

    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: primary),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: bgInput,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: error),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      labelStyle: const TextStyle(color: textSecondary),
      hintStyle: const TextStyle(color: textMuted),
      prefixIconColor: textSecondary,
      suffixIconColor: textSecondary,
    ),

    cardTheme: const CardThemeData(
      elevation: 0,
      color: bgCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
        side: BorderSide(color: border),
      ),
    ),

    dividerTheme: const DividerThemeData(color: divider, space: 1),

    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: bgCard,
      selectedItemColor: primary,
      unselectedItemColor: textMuted,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),

    dialogTheme: const DialogThemeData(
      backgroundColor: bgCard,
      titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          fontFamily: 'Inter'),
      contentTextStyle: TextStyle(color: textSecondary, fontFamily: 'Inter'),
    ),

    popupMenuTheme: const PopupMenuThemeData(
      color: bgCard,
      textStyle: TextStyle(color: textPrimary, fontFamily: 'Inter'),
    ),

    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: bgCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
    ),

    snackBarTheme: const SnackBarThemeData(
      backgroundColor: bgElevated,
      contentTextStyle: TextStyle(color: textPrimary, fontFamily: 'Inter'),
    ),
  );
}
