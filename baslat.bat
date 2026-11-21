@echo off
chcp 65001 >nul
title SUP PROJECTS Destek Botu
where node >nul 2>nul || (echo Node.js yuklu degil. https://nodejs.org adresinden LTS surumunu kur, sonra tekrar ac. & pause & exit /b)
if not exist .env (
  copy .env.example .env >nul
  echo .env dosyasi olusturuldu. Not Defteri aciliyor: TOKEN= satirina botunun tokenini yapistir, kaydet ve bu pencereyi tekrar ac.
  notepad .env
  pause
  exit /b
)
if not exist node_modules (echo Ilk acilis: gerekli dosyalar indiriliyor... & call npm install)
call npm start
pause
