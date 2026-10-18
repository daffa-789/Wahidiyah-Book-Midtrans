# -*- coding: utf-8 -*-
"""
Script Generator Diagram Draw.io untuk Skripsi Wahidiyah Book
Menghasilkan:
1. use_case_diagram.drawio
2. activity_diagram_qris.drawio
3. sequence_diagram_qris.drawio
4. wahidiyah_book_uml_all.drawio (Multi-page gabungan)
"""

import os
import json
import subprocess
import xml.etree.ElementTree as ET

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIG_DIR = os.path.join(BASE_DIR, "docs", "diagrams")
SEQLAYOUT_SCRIPT = r"C:\Users\Daffa\.gemini\config\skills\drawio-skill\scripts\seqlayout.py"
VALIDATE_SCRIPT = r"C:\Users\Daffa\.gemini\config\skills\drawio-skill\scripts\validate.py"

os.makedirs(FIG_DIR, exist_ok=True)


# # ==============================================================================
# 1. BUILD USE CASE DIAGRAM
# ==============================================================================
def build_use_case_xml():
    """Membangun berkas XML Draw.io Use Case Diagram lengkap dan profesional."""
    return '''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="drawio" version="26.0.0">
  <diagram id="use-case-page" name="Use Case Diagram - Wahidiyah Book">
    <mxGraphModel dx="1422" dy="850" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1350" pageHeight="1020" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- SYSTEM BOUNDARY CONTAINER -->
        <mxCell id="boundary" value="&lt;b&gt;Sistem Perpustakaan Digital &amp;amp; Real Midtrans QRIS (Wahidiyah Book)&lt;/b&gt;" style="shape=rect;html=1;verticalAlign=top;fontStyle=1;whiteSpace=wrap;align=center;fillColor=#f8fafc;strokeColor=#64748b;strokeWidth=2;dashed=0;spacingTop=12;fontSize=13;fontColor=#0f172a;container=1;collapsible=0;pointerEvents=0;" vertex="1" parent="1">
          <mxGeometry x="270" y="40" width="760" height="920" as="geometry" />
        </mxCell>

        <!-- USE CASES INSIDE BOUNDARY (PARENT = boundary, COORDINATES RELATIVE TO BOUNDARY) -->
        <!-- AREA TAMU / PUBLIK -->
        <mxCell id="uc01" value="UC01: Melihat Katalog &amp;amp;&#xa;Filter Kategori Buku" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#e0f2fe;strokeColor=#0284c7;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#0369a1;" vertex="1" parent="boundary">
          <mxGeometry x="50" y="40" width="180" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc02" value="UC02: Membaca Buku Publik&#xa;(Akses Terbuka/Gratis)" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#e0f2fe;strokeColor=#0284c7;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#0369a1;" vertex="1" parent="boundary">
          <mxGeometry x="50" y="120" width="180" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc03" value="UC03: Pendaftaran Akun&#xa;(Dual-Channel 2-Fase)" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#e0f2fe;strokeColor=#0284c7;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#0369a1;" vertex="1" parent="boundary">
          <mxGeometry x="50" y="200" width="180" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc04" value="UC04: Verifikasi Kode OTP&#xa;(Batas 10 Menit / Lockout)" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#fee2e2;strokeColor=#dc2626;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#991b1b;" vertex="1" parent="boundary">
          <mxGeometry x="340" y="200" width="180" height="60" as="geometry" />
        </mxCell>

        <!-- AREA PENGGUNA / MEMBER -->
        <mxCell id="uc05" value="UC05: Masuk / Login&#xa;(Email &amp;amp; Google OAuth 2.0)" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#dbeafe;strokeColor=#2563eb;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#1e40af;" vertex="1" parent="boundary">
          <mxGeometry x="50" y="300" width="180" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc06" value="UC06: Membaca Buku Pro&#xa;(Protected PDF Reader)" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#dbeafe;strokeColor=#2563eb;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#1e40af;" vertex="1" parent="boundary">
          <mxGeometry x="50" y="380" width="180" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc07" value="UC07: Melacak Halaman&#xa;Terakhir (Last-Read Tracker)" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#fef3c7;strokeColor=#d97706;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#92400e;" vertex="1" parent="boundary">
          <mxGeometry x="340" y="380" width="180" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc08" value="UC08: Pemesanan Langganan Pro&#xa;&amp;amp; Generate QRIS" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#dbeafe;strokeColor=#2563eb;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#1e40af;" vertex="1" parent="boundary">
          <mxGeometry x="50" y="460" width="180" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc09" value="UC09: Pembayaran QRIS &amp;amp;&#xa;Penyelesaian Idempoten CAS" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#ffedd5;strokeColor=#ea580c;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#9a3412;" vertex="1" parent="boundary">
          <mxGeometry x="340" y="460" width="190" height="65" as="geometry" />
        </mxCell>

        <mxCell id="uc10" value="UC10: Mengunduh Faktur /&#xa;Kwitansi Pembayaran PDF" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#dbeafe;strokeColor=#2563eb;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#1e40af;" vertex="1" parent="boundary">
          <mxGeometry x="50" y="540" width="180" height="60" as="geometry" />
        </mxCell>

        <!-- AREA PENGELOLA / ADMIN -->
        <mxCell id="uc11" value="UC11: Manajemen Buku &amp;amp;&#xa;Kompresi Sampul WebP" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#fef3c7;strokeColor=#d97706;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#78350f;" vertex="1" parent="boundary">
          <mxGeometry x="50" y="630" width="180" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc12" value="UC12: Kelola Agenda Acara&#xa;&amp;amp; Banner Karousel" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#fef3c7;strokeColor=#d97706;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#78350f;" vertex="1" parent="boundary">
          <mxGeometry x="50" y="710" width="180" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc13" value="UC13: Monitoring Transaksi &amp;amp;&#xa;Audit Idempotensi" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#fef3c7;strokeColor=#d97706;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#78350f;" vertex="1" parent="boundary">
          <mxGeometry x="50" y="790" width="180" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc14" value="UC14: Ekspor Laporan Data &amp;amp;&#xa;Transaksi ke Excel (.xlsx)" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#dcfce7;strokeColor=#16a34a;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#14532d;" vertex="1" parent="boundary">
          <mxGeometry x="340" y="740" width="180" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc15" value="UC15: Visual Analytics Tren&#xa;Pendapatan &amp;amp; Pengguna" style="shape=ellipse;html=1;strokeWidth=1.5;fillColor=#dcfce7;strokeColor=#16a34a;fontStyle=1;whiteSpace=wrap;align=center;perimeter=ellipsePerimeter;fontFamily=Arial;fontSize=11;fontColor=#14532d;" vertex="1" parent="boundary">
          <mxGeometry x="340" y="820" width="180" height="60" as="geometry" />
        </mxCell>

        <!-- HUMAN ACTORS (LEFT, PARENT = 1) -->
        <!-- Tamu -->
        <mxCell id="actor_tamu" value="&lt;b&gt;Tamu&lt;/b&gt;&lt;br&gt;&lt;i&gt;(Guest / Publik)&lt;/i&gt;" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontFamily=Arial;fontSize=11;fillColor=#e2e8f0;strokeColor=#475569;strokeWidth=1.5;fontColor=#1e293b;" vertex="1" parent="1">
          <mxGeometry x="70" y="140" width="50" height="90" as="geometry" />
        </mxCell>

        <!-- Pengguna / Member -->
        <mxCell id="actor_user" value="&lt;b&gt;Pengguna&lt;/b&gt;&lt;br&gt;&lt;i&gt;(Jamaah / Member)&lt;/i&gt;" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontFamily=Arial;fontSize=11;fillColor=#dbeafe;strokeColor=#2563eb;strokeWidth=1.5;fontColor=#1e3a8a;" vertex="1" parent="1">
          <mxGeometry x="70" y="420" width="50" height="90" as="geometry" />
        </mxCell>

        <!-- Pengelola / Admin -->
        <mxCell id="actor_admin" value="&lt;b&gt;Pengelola&lt;/b&gt;&lt;br&gt;&lt;i&gt;(Administrator)&lt;/i&gt;" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontFamily=Arial;fontSize=11;fillColor=#fef3c7;strokeColor=#d97706;strokeWidth=1.5;fontColor=#78350f;" vertex="1" parent="1">
          <mxGeometry x="70" y="740" width="50" height="90" as="geometry" />
        </mxCell>

        <!-- GENERALIZATION: Pengguna -> Tamu -->
        <mxCell id="gen_user_tamu" value="" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;endFill=0;endSize=12;strokeColor=#64748b;strokeWidth=1.5;" edge="1" parent="1" source="actor_user" target="actor_tamu">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- SECONDARY / SYSTEM ACTORS (RIGHT, PARENT = 1) -->
        <!-- Midtrans Payment Gateway -->
        <mxCell id="actor_midtrans" value="&amp;laquo;External System&amp;raquo;&#xa;&lt;b&gt;Midtrans Core API&lt;/b&gt;&#xa;(Payment Gateway QRIS)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffedd5;strokeColor=#ea580c;strokeWidth=1.5;fontFamily=Arial;fontSize=11;fontColor=#9a3412;" vertex="1" parent="1">
          <mxGeometry x="1100" y="480" width="170" height="70" as="geometry" />
        </mxCell>

        <!-- Notification & OTP Gateway -->
        <mxCell id="actor_otp" value="&amp;laquo;External Service&amp;raquo;&#xa;&lt;b&gt;Gateway OTP &amp;amp; Surel&lt;/b&gt;&#xa;(WhatsApp API &amp;amp; Gmail API)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;strokeWidth=1.5;fontFamily=Arial;fontSize=11;fontColor=#14532d;" vertex="1" parent="1">
          <mxGeometry x="1100" y="240" width="170" height="70" as="geometry" />
        </mxCell>

        <!-- Supabase Database -->
        <mxCell id="actor_db" value="&amp;laquo;Database&amp;raquo;&#xa;&lt;b&gt;Supabase PostgreSQL&lt;/b&gt;&#xa;(RLS &amp;amp; Trigger Function)" style="shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#f1f5f9;strokeColor=#475569;strokeWidth=1.5;fontFamily=Arial;fontSize=11;fontColor=#334155;" vertex="1" parent="1">
          <mxGeometry x="1115" y="710" width="140" height="85" as="geometry" />
        </mxCell>

        <!-- RELATIONSHIPS: TAMU -> USE CASES -->
        <mxCell id="rel_tamu_uc01" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#64748b;strokeWidth=1.2;" edge="1" parent="1" source="actor_tamu" target="uc01">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel_tamu_uc02" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#64748b;strokeWidth=1.2;" edge="1" parent="1" source="actor_tamu" target="uc02">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel_tamu_uc03" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#64748b;strokeWidth=1.2;" edge="1" parent="1" source="actor_tamu" target="uc03">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- RELATIONSHIPS: PENGGUNA -> USE CASES -->
        <mxCell id="rel_user_uc05" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2563eb;strokeWidth=1.2;" edge="1" parent="1" source="actor_user" target="uc05">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel_user_uc06" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2563eb;strokeWidth=1.2;" edge="1" parent="1" source="actor_user" target="uc06">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel_user_uc08" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2563eb;strokeWidth=1.2;" edge="1" parent="1" source="actor_user" target="uc08">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel_user_uc10" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2563eb;strokeWidth=1.2;" edge="1" parent="1" source="actor_user" target="uc10">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- RELATIONSHIPS: ADMIN -> USE CASES -->
        <mxCell id="rel_admin_uc11" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#d97706;strokeWidth=1.2;" edge="1" parent="1" source="actor_admin" target="uc11">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel_admin_uc12" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#d97706;strokeWidth=1.2;" edge="1" parent="1" source="actor_admin" target="uc12">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel_admin_uc13" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#d97706;strokeWidth=1.2;" edge="1" parent="1" source="actor_admin" target="uc13">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel_admin_uc14" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#d97706;strokeWidth=1.2;" edge="1" parent="1" source="actor_admin" target="uc14">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel_admin_uc15" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#d97706;strokeWidth=1.2;" edge="1" parent="1" source="actor_admin" target="uc15">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- INCLUDES & EXTENDS (PARENT = boundary) -->
        <!-- UC03 -> <<include>> -> UC04 -->
        <mxCell id="inc_uc03_uc04" value="&amp;laquo;include&amp;raquo;" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;verticalAlign=bottom;dashed=1;strokeColor=#dc2626;strokeWidth=1.2;fontFamily=Arial;fontSize=10;fontColor=#991b1b;" edge="1" parent="boundary" source="uc03" target="uc04">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- UC07 -> <<extend>> -> UC06 -->
        <mxCell id="ext_uc07_uc06" value="&amp;laquo;extend&amp;raquo;" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;verticalAlign=bottom;dashed=1;strokeColor=#d97706;strokeWidth=1.2;fontFamily=Arial;fontSize=10;fontColor=#92400e;" edge="1" parent="boundary" source="uc07" target="uc06">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- UC08 -> <<include>> -> UC09 -->
        <mxCell id="inc_uc08_uc09" value="&amp;laquo;include&amp;raquo;" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;verticalAlign=bottom;dashed=1;strokeColor=#ea580c;strokeWidth=1.2;fontFamily=Arial;fontSize=10;fontColor=#9a3412;" edge="1" parent="boundary" source="uc08" target="uc09">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- EXTERNAL SYSTEM CONNECTIONS -->
        <!-- UC04 -> Gateway OTP -->
        <mxCell id="rel_uc04_otp" style="edgeStyle=none;html=1;endArrow=none;dashed=1;strokeColor=#16a34a;strokeWidth=1.2;" edge="1" parent="1" source="uc04" target="actor_otp">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- UC09 -> Midtrans Core API -->
        <mxCell id="rel_uc09_midtrans" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#ea580c;strokeWidth=1.5;" edge="1" parent="1" source="uc09" target="actor_midtrans">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- UC13 -> Supabase DB -->
        <mxCell id="rel_uc13_db" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=none;dashed=1;strokeColor=#64748b;strokeWidth=1.2;" edge="1" parent="1" source="uc13" target="actor_db">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''


# ==============================================================================
# 2. BUILD ACTIVITY DIAGRAM
# ==============================================================================
def build_activity_xml():
    """Membangun berkas XML Draw.io Activity Diagram (Swimlane Cross-Functional)."""
    return '''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="drawio" version="26.0.0">
  <diagram id="act-page" name="Activity Diagram - Pembayaran QRIS Midtrans">
    <mxGraphModel dx="1422" dy="850" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1350" pageHeight="1450" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- POOL CONTAINER -->
        <mxCell id="pool" value="Alur Pembayaran QRIS Midtrans &amp;amp; Penyelesaian Transaksi Idempoten (Compare-and-Swap)" style="swimlane;html=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=1;resizeParent=1;resizeParentMax=0;collapsible=0;fontFamily=Arial;fontSize=13;fontStyle=1;fillColor=#f1f5f9;strokeColor=#64748b;" vertex="1" parent="1">
          <mxGeometry x="40" y="40" width="1260" height="1350" as="geometry" />
        </mxCell>

        <!-- LANE 1: PENGGUNA (PWA) -->
        <mxCell id="lane_user" value="Pengguna (Klien PWA)" style="swimlane;html=1;startSize=30;horizontal=0;collapsible=0;fillColor=#eff6ff;strokeColor=#93c5fd;fontFamily=Arial;fontSize=11;fontStyle=1;fontColor=#1e3a8a;" vertex="1" parent="pool">
          <mxGeometry x="30" y="0" width="310" height="1350" as="geometry" />
        </mxCell>

        <!-- LANE 2: BACKEND SERVER -->
        <mxCell id="lane_server" value="Backend API (Node.js &amp;amp; Express)" style="swimlane;html=1;startSize=30;horizontal=0;collapsible=0;fillColor=#f0fdf4;strokeColor=#86efac;fontFamily=Arial;fontSize=11;fontStyle=1;fontColor=#14532d;" vertex="1" parent="pool">
          <mxGeometry x="340" y="0" width="340" height="1350" as="geometry" />
        </mxCell>

        <!-- LANE 3: MIDTRANS CORE API -->
        <mxCell id="lane_midtrans" value="Midtrans Core API (Payment Gateway)" style="swimlane;html=1;startSize=30;horizontal=0;collapsible=0;fillColor=#fff7ed;strokeColor=#fdba74;fontFamily=Arial;fontSize=11;fontStyle=1;fontColor=#7c2d12;" vertex="1" parent="pool">
          <mxGeometry x="680" y="0" width="280" height="1350" as="geometry" />
        </mxCell>

        <!-- LANE 4: BASIS DATA SUPABASE -->
        <mxCell id="lane_db" value="Basis Data (Supabase PostgreSQL)" style="swimlane;html=1;startSize=30;horizontal=0;collapsible=0;fillColor=#f8fafc;strokeColor=#cbd5e1;fontFamily=Arial;fontSize=11;fontStyle=1;fontColor=#334155;" vertex="1" parent="pool">
          <mxGeometry x="960" y="0" width="300" height="1350" as="geometry" />
        </mxCell>

        <!-- NODES INSIDE LANE 1 (PENGGUNA) -->
        <mxCell id="act_start" value="" style="ellipse;html=1;shape=startState;fillColor=#1e293b;strokeColor=#0f172a;" vertex="1" parent="lane_user">
          <mxGeometry x="135" y="50" width="30" height="30" as="geometry" />
        </mxCell>

        <mxCell id="act_pilih_paket" value="Pilih Paket Langganan Pro&#xa;&amp;amp; Klik 'Bayar QRIS'" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#2563eb;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_user">
          <mxGeometry x="65" y="110" width="170" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_tampil_qris" value="Tampilkan QR Code Interaktif&#xa;&amp;amp; Timer Hitung Mundur (15m)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#2563eb;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_user">
          <mxGeometry x="65" y="380" width="170" height="50" as="geometry" />
        </mxCell>

        <!-- FORK PARALLEL -->
        <mxCell id="act_fork" value="" style="shape=rect;html=1;fillColor=#1e293b;strokeColor=#0f172a;" vertex="1" parent="lane_user">
          <mxGeometry x="70" y="460" width="160" height="8" as="geometry" />
        </mxCell>

        <mxCell id="act_scan_bayar" value="Pindai QRIS &amp;amp; Konfirmasi&#xa;Transfer via E-Wallet" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#2563eb;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_user">
          <mxGeometry x="15" y="500" width="135" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_polling" value="Jalur B: Jalankan Polling&#xa;GET /qris/:id/status (tiap 3s)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#2563eb;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_user">
          <mxGeometry x="160" y="500" width="140" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_join" value="" style="shape=rect;html=1;fillColor=#1e293b;strokeColor=#0f172a;" vertex="1" parent="lane_user">
          <mxGeometry x="70" y="580" width="160" height="8" as="geometry" />
        </mxCell>

        <mxCell id="act_notif_sukses" value="Terima Status Sukses&#xa;&amp;amp; Perbarui State Pro (Broadcast)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;fontFamily=Arial;fontSize=11;fontStyle=1;fontColor=#14532d;" vertex="1" parent="lane_user">
          <mxGeometry x="65" y="1180" width="170" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_end" value="" style="ellipse;html=1;shape=endState;fillColor=#1e293b;strokeColor=#0f172a;" vertex="1" parent="lane_user">
          <mxGeometry x="135" y="1270" width="30" height="30" as="geometry" />
        </mxCell>


        <!-- NODES INSIDE LANE 2 (BACKEND SERVER) -->
        <mxCell id="act_val_req" value="Validasi Sesi JWT &amp;amp; Zod,&#xa;Generate Order ID Unik" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#16a34a;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_server">
          <mxGeometry x="85" y="110" width="170" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_simpan_pending" value="Simpan Data Transaksi Awal&#xa;(status: 'pending')" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#16a34a;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_server">
          <mxGeometry x="85" y="270" width="170" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_kirim_qris" value="Kirim Payload QRIS&#xa;&amp;amp; Expire Time ke Klien" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#16a34a;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_server">
          <mxGeometry x="85" y="380" width="170" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_terima_event" value="Terima Notifikasi (Jalur A)&#xa;atau Permintaan Polling (Jalur B)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#16a34a;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_server">
          <mxGeometry x="85" y="620" width="170" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_dec_sig" value="Signature SHA-512&#xa;&amp;amp; Nominal Valid?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=#d97706;fontFamily=Arial;fontSize=10;fontStyle=1;" vertex="1" parent="lane_server">
          <mxGeometry x="90" y="700" width="160" height="70" as="geometry" />
        </mxCell>

        <mxCell id="act_reject_401" value="Tolak Request (HTTP 401)&#xa;Fail-Closed Policy" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fee2e2;strokeColor=#dc2626;fontFamily=Arial;fontSize=10;fontColor=#991b1b;" vertex="1" parent="lane_server">
          <mxGeometry x="20" y="800" width="140" height="45" as="geometry" />
        </mxCell>

        <mxCell id="act_cas" value="Jalankan CAS Atomik:&#xa;UPDATE transactions SET status='success'&#xa;WHERE id=? AND status='pending'" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;fontFamily=Arial;fontSize=10;fontStyle=1;" vertex="1" parent="lane_server">
          <mxGeometry x="60" y="860" width="220" height="55" as="geometry" />
        </mxCell>

        <mxCell id="act_dec_cas" value="Rows Affected == 1&#xa;(Berhasil Diklaim)?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=#d97706;fontFamily=Arial;fontSize=10;fontStyle=1;" vertex="1" parent="lane_server">
          <mxGeometry x="90" y="940" width="160" height="70" as="geometry" />
        </mxCell>

        <mxCell id="act_idempoten_skip" value="Abaikan Penyelesaian:&#xa;Sudah Ditangani Jalur Lain&#xa;(Idempotensi Terjaga)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f1f5f9;strokeColor=#64748b;fontFamily=Arial;fontSize=10;fontColor=#475569;" vertex="1" parent="lane_server">
          <mxGeometry x="10" y="1030" width="140" height="55" as="geometry" />
        </mxCell>

        <mxCell id="act_call_activate" value="Panggil activatePaidMembership()&#xa;Aktivasi Paket ke Supabase" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#16a34a;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_server">
          <mxGeometry x="150" y="1030" width="170" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_dec_act" value="Aktivasi Berhasil?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=#d97706;fontFamily=Arial;fontSize=10;fontStyle=1;" vertex="1" parent="lane_server">
          <mxGeometry x="165" y="1100" width="140" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_compensate" value="Transaksi Kompensasi:&#xa;Rollback status ← 'pending'" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fee2e2;strokeColor=#dc2626;fontFamily=Arial;fontSize=10;fontColor=#991b1b;" vertex="1" parent="lane_server">
          <mxGeometry x="10" y="1120" width="140" height="45" as="geometry" />
        </mxCell>

        <!-- NODES INSIDE LANE 3 (MIDTRANS) -->
        <mxCell id="act_mid_charge" value="Generate Payload QRIS EMVCo&#xa;&amp;amp; Buat Transaksi di Sandbox" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#ea580c;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_midtrans">
          <mxGeometry x="50" y="190" width="180" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_mid_settle" value="Verifikasi Settlement Dana&#xa;&amp;amp; Catat Status 'settlement'" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#ea580c;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_midtrans">
          <mxGeometry x="50" y="500" width="180" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_mid_webhook" value="Jalur A: Kirim Webhook Notifikasi&#xa;POST /midtrans/notification" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#ea580c;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_midtrans">
          <mxGeometry x="50" y="620" width="180" height="50" as="geometry" />
        </mxCell>


        <!-- NODES INSIDE LANE 4 (SUPABASE DB) -->
        <mxCell id="act_db_insert" value="INSERT INTO transactions&#xa;(status: 'pending', amount, user_id)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_db">
          <mxGeometry x="60" y="270" width="180" height="50" as="geometry" />
        </mxCell>

        <mxCell id="act_db_update_cas" value="Eksekusi Kueri Atomik&#xa;&amp;amp; Kembalikan Rows Affected" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;fontFamily=Arial;fontSize=11;" vertex="1" parent="lane_db">
          <mxGeometry x="60" y="860" width="180" height="55" as="geometry" />
        </mxCell>

        <mxCell id="act_db_sub" value="INSERT INTO subscriptions&#xa;Perbarui Status Pengguna (is_pro: true)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;fontFamily=Arial;fontSize=11;fontStyle=1;" vertex="1" parent="lane_db">
          <mxGeometry x="60" y="1030" width="180" height="50" as="geometry" />
        </mxCell>


        <!-- EDGES / TRANSITIONS -->
        <!-- User start -> Pilih Paket -->
        <mxCell id="e01" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.5;" edge="1" parent="1" source="act_start" target="act_pilih_paket">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Pilih Paket -> Validasi Server -->
        <mxCell id="e02" value="Request Pembayaran" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#2563eb;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_pilih_paket" target="act_val_req">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Server Validasi -> Midtrans Charge -->
        <mxCell id="e03" value="POST /v2/charge" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#16a34a;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_val_req" target="act_mid_charge">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Midtrans Charge -> Simpan Pending Server -->
        <mxCell id="e04" value="Payload QRIS" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#ea580c;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_mid_charge" target="act_simpan_pending">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Server Simpan -> Supabase Insert -->
        <mxCell id="e05" value="Simpan Pending" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#16a34a;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_simpan_pending" target="act_db_insert">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Supabase Insert -> Server Kirim QRIS -->
        <mxCell id="e06" value="Tersimpan" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#475569;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_db_insert" target="act_kirim_qris">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Server Kirim QRIS -> User Tampilkan -->
        <mxCell id="e07" value="Kirim Data QRIS" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#2563eb;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_kirim_qris" target="act_tampil_qris">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- User Tampil -> Fork -->
        <mxCell id="e08" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.5;" edge="1" parent="1" source="act_tampil_qris" target="act_fork">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Fork -> Scan & Polling -->
        <mxCell id="e09" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.5;" edge="1" parent="1" source="act_fork" target="act_scan_bayar">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e10" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.5;" edge="1" parent="1" source="act_fork" target="act_polling">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Scan Bayar -> Midtrans Settlement -->
        <mxCell id="e11" value="Transfer Dana" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#ea580c;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_scan_bayar" target="act_mid_settle">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Midtrans Settlement -> Webhook -->
        <mxCell id="e12" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#ea580c;strokeWidth=1.5;" edge="1" parent="1" source="act_mid_settle" target="act_mid_webhook">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Midtrans Webhook -> Server Terima (Jalur A) -->
        <mxCell id="e13" value="Jalur A: Webhook" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#ea580c;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_mid_webhook" target="act_terima_event">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Polling -> Server Terima (Jalur B) -->
        <mxCell id="e14" value="Jalur B: Polling" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#2563eb;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_polling" target="act_terima_event">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Server Terima -> Decision Sig -->
        <mxCell id="e15" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#16a34a;strokeWidth=1.5;" edge="1" parent="1" source="act_terima_event" target="act_dec_sig">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Decision Sig -> TIDAK -> Tolak 401 -->
        <mxCell id="e16" value="TIDAK" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#dc2626;strokeWidth=1.5;fontFamily=Arial;fontSize=10;fontColor=#dc2626;" edge="1" parent="1" source="act_dec_sig" target="act_reject_401">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Decision Sig -> YA -> Eksekusi CAS -->
        <mxCell id="e17" value="YA" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#16a34a;strokeWidth=1.5;fontFamily=Arial;fontSize=10;fontColor=#16a34a;" edge="1" parent="1" source="act_dec_sig" target="act_cas">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- CAS -> Supabase Update CAS -->
        <mxCell id="e18" value="CAS Update" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#16a34a;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_cas" target="act_db_update_cas">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Supabase Update CAS -> Decision CAS -->
        <mxCell id="e19" value="Hasil Baris" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#475569;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_db_update_cas" target="act_dec_cas">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Decision CAS -> 0 -> Idempoten Skip -->
        <mxCell id="e20" value="0 (Gagal CAS)" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#64748b;strokeWidth=1.5;fontFamily=Arial;fontSize=10;fontColor=#64748b;" edge="1" parent="1" source="act_dec_cas" target="act_idempoten_skip">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Decision CAS -> 1 -> Call Activate -->
        <mxCell id="e21" value="1 (Berhasil)" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#16a34a;strokeWidth=1.5;fontFamily=Arial;fontSize=10;fontColor=#16a34a;" edge="1" parent="1" source="act_dec_cas" target="act_call_activate">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Call Activate -> Supabase Subscriptions -->
        <mxCell id="e22" value="Aktivasi Pro" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#16a34a;strokeWidth=1.5;fontFamily=Arial;fontSize=10;" edge="1" parent="1" source="act_call_activate" target="act_db_sub">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Supabase Subscriptions -> Decision Activate -->
        <mxCell id="e23" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#475569;strokeWidth=1.5;" edge="1" parent="1" source="act_db_sub" target="act_dec_act">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Decision Activate -> TIDAK -> Kompensasi -->
        <mxCell id="e24" value="GAGAL" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#dc2626;strokeWidth=1.5;fontFamily=Arial;fontSize=10;fontColor=#dc2626;" edge="1" parent="1" source="act_dec_act" target="act_compensate">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Decision Activate -> YA -> User Notif Sukses -->
        <mxCell id="e25" value="SUKSES" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#16a34a;strokeWidth=1.5;fontFamily=Arial;fontSize=10;fontColor=#16a34a;" edge="1" parent="1" source="act_dec_act" target="act_notif_sukses">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Idempoten Skip -> User Notif Sukses (langganan sudah aktif) -->
        <mxCell id="e26" value="Status Terakhir Sukses" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#64748b;strokeWidth=1.2;fontFamily=Arial;fontSize=9;" edge="1" parent="1" source="act_idempoten_skip" target="act_notif_sukses">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- User Notif Sukses -> End -->
        <mxCell id="e27" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.5;" edge="1" parent="1" source="act_notif_sukses" target="act_end">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''


# ==============================================================================
# 3. BUILD SEQUENCE DIAGRAM
# ==============================================================================
def build_sequence_diagram():
    """Membangun Sequence Diagram menggunakan seqlayout.py lalu mengembalikan path-nya."""
    seq_data = {
        "title": "Sequence Diagram - Alur Idempotensi QRIS Midtrans CAS",
        "participants": [
            {"id": "u", "label": "Pengguna (PWA)", "actor": True},
            {"id": "fe", "label": "Klien Web (React 18)"},
            {"id": "be", "label": "Backend API (Express)"},
            {"id": "mid", "label": "Midtrans Core API"},
            {"id": "db", "label": "Supabase PostgreSQL"}
        ],
        "messages": [
            {"from": "u", "to": "fe", "label": "1. Pilih Paket Pro & Klik 'Bayar QRIS'"},
            {"from": "fe", "to": "be", "label": "2. POST /api/payments/qris/charge (JWT auth)"},
            {"from": "be", "to": "be", "label": "3. Validasi Zod & Generate order_id unik"},
            {"from": "be", "to": "mid", "label": "4. POST /v2/charge (Server-Key, type: qris)"},
            {"from": "mid", "to": "be", "label": "5. 200 OK (qr_string, expire_time 15m)", "return": True},
            {"from": "be", "to": "db", "label": "6. INSERT INTO transactions (status: 'pending')"},
            {"from": "db", "to": "be", "label": "7. Transaksi Pending Tersimpan", "return": True},
            {"from": "be", "to": "fe", "label": "8. 201 Created { qr_string, order_id, expires_at }", "return": True},
            {"from": "fe", "to": "u", "label": "9. Render QR Code Interaktif & Timer", "return": True},
            {"from": "fe", "to": "be", "label": "10. Polling Status: GET /qris/:id/status (loop 3s)", "async": True},
            {"from": "u", "to": "mid", "label": "11. Scan QRIS & Transfer Dana via E-Wallet"},
            {"note": "Dua Jalur Penyelesaian: Webhook (A) dan Polling Otoritatif (B)", "over": "mid"},
            {"from": "mid", "to": "be", "label": "12. POST /api/payments/midtrans/notification (Jalur A)"},
            {"from": "be", "to": "be", "label": "13. Verifikasi SHA-512 Signature & timingSafeEqual"},
            {"from": "be", "to": "db", "label": "14. UPDATE transactions SET status='success' WHERE id=? AND status='pending' (CAS)"},
            {"from": "db", "to": "be", "label": "15. Rows affected = 1 (Klaim Berhasil)", "return": True},
            {"from": "be", "to": "db", "label": "16. activatePaidMembership() -> INSERT INTO subscriptions"},
            {"from": "db", "to": "be", "label": "17. Langganan Pro Aktif (Masa berlaku +30 hari)", "return": True},
            {"from": "be", "to": "mid", "label": "18. 200 OK (Webhook Acknowledged)", "return": True},
            {"from": "fe", "to": "be", "label": "19. Polling Berkala: GET /qris/:id/status (Jalur B)"},
            {"from": "be", "to": "db", "label": "20. SELECT status, is_pro FROM transactions JOIN users"},
            {"from": "db", "to": "be", "label": "21. Data: status='success', is_pro=true", "return": True},
            {"from": "be", "to": "fe", "label": "22. 200 OK { status: 'success', message: 'Membership Pro Active' }", "return": True},
            {"from": "fe", "to": "fe", "label": "23. BroadcastChannel.postMessage('MEMBERSHIP_UPDATED')"},
            {"from": "fe", "to": "u", "label": "24. Tampilkan Faktur Sukses & Buka Ruang Baca Kitab Pro", "return": True}
        ]
    }

    json_tmp = os.path.join(FIG_DIR, "tmp_seq.json")
    with open(json_tmp, "w", encoding="utf-8") as f:
        json.dump(seq_data, f, indent=2)

    target_drawio = os.path.join(FIG_DIR, "sequence_diagram_qris.drawio")
    cmd = ["python", SEQLAYOUT_SCRIPT, json_tmp, "-o", target_drawio]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"Gagal generate sequence diagram: {res.stderr}")

    if os.path.exists(json_tmp):
        os.remove(json_tmp)

    return target_drawio


# ==============================================================================
# 4. BUILD COMBINED MULTI-PAGE DIAGRAM
# ==============================================================================
def build_multi_page_drawio(uc_path, act_path, seq_path, out_path):
    """Menggabungkan ketiga diagram ke dalam 1 berkas Draw.io multi-halaman."""
    root_mxfile = ET.Element("mxfile", {"host": "drawio", "version": "26.0.0"})

    for path, page_name in [
        (uc_path, "Use Case Diagram"),
        (act_path, "Activity Diagram - QRIS Midtrans"),
        (seq_path, "Sequence Diagram - CAS Idempotensi")
    ]:
        tree = ET.parse(path)
        diagram_elem = tree.getroot().find("diagram")
        if diagram_elem is not None:
            diagram_elem.set("name", page_name)
            root_mxfile.append(diagram_elem)

    tree = ET.ElementTree(root_mxfile)
    tree.write(out_path, encoding="utf-8", xml_declaration=True)
    print(f"[OK] Berkas multi-halaman tersimpan: {out_path}")


# ==============================================================================
# MAIN EXECUTION
# ==============================================================================
def main():
    print("=" * 60)
    print("MENGHASILKAN DIAGRAM DRAW.IO UNTUK SKRIPSI WAHIDIYAH BOOK")
    print("=" * 60)

    # 1. Use Case Diagram
    uc_file = os.path.join(FIG_DIR, "use_case_diagram.drawio")
    with open(uc_file, "w", encoding="utf-8") as f:
        f.write(build_use_case_xml())
    print(f"[1/4] Use Case Diagram dibuat: {uc_file}")

    # 2. Activity Diagram
    act_file = os.path.join(FIG_DIR, "activity_diagram_qris.drawio")
    with open(act_file, "w", encoding="utf-8") as f:
        f.write(build_activity_xml())
    print(f"[2/4] Activity Diagram dibuat: {act_file}")

    # 3. Sequence Diagram
    seq_file = build_sequence_diagram()
    print(f"[3/4] Sequence Diagram dibuat: {seq_file}")

    # 4. Multi-Page Master File
    all_file = os.path.join(FIG_DIR, "wahidiyah_book_uml_all.drawio")
    build_multi_page_drawio(uc_file, act_file, seq_file, all_file)
    print(f"[4/4] Multi-Page Diagram dibuat: {all_file}")

    print(f"\nSemua berkas diagram Draw.io tersimpan di: {FIG_DIR}")

    # Validasi Structural Draw.io untuk semua file
    print("\n" + "=" * 60)
    print("VALIDASI STRUKTURAL SKILL DRAWIO")
    print("=" * 60)
    for f in [uc_file, act_file, seq_file, all_file]:
        res = subprocess.run(["python", VALIDATE_SCRIPT, f, "--score"], capture_output=True, text=True)
        fname = os.path.basename(f)
        print(f"[{fname}]:")
        for line in res.stdout.strip().split("\n"):
            print(f"  {line}")


if __name__ == "__main__":
    main()
