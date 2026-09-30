# -*- mode: python ; coding: utf-8 -*-
# FileForge — PyInstaller Spec File
# Comprehensive build to ensure ALL dependencies are bundled.

import os
import sys

site_packages = os.path.join(
    os.path.dirname(sys.executable), 'Lib', 'site-packages'
)

# ── Collect native binaries that PyInstaller misses ──────────────────────────
# pillow_heif ships its native DLLs loose in site-packages (not inside the package)
pillow_heif_binaries = []
_sp_dlls = [
    '_pillow_heif.cp310-win_amd64.pyd',
    'libheif-30fc1b3ceee9088934615cbf4948eba3.dll',
    'libde265-0-863aced21c291386b51bbbd6c57331e8.dll',
    'libx265-217-8a7f7f4ebe0ffaa73ce4bb306c2d18d6.dll',
    'libgcc_s_seh-1-7579db3ccd9543f896752ed45d8cb013.dll',
    'libstdc++-6-a168feb806be6a6b9920422b91e14e6f.dll',
    'libwinpthread-1-cd4f4bcf906810bdc5341685d1696fa6.dll',
]
for dll in _sp_dlls:
    full = os.path.join(site_packages, dll)
    if os.path.exists(full):
        pillow_heif_binaries.append((full, '.'))

# pymupdf native DLL
pymupdf_binaries = []
_pymupdf_dll = os.path.join(site_packages, 'pymupdf', 'mupdfcpp64.dll')
if os.path.exists(_pymupdf_dll):
    pymupdf_binaries.append((_pymupdf_dll, 'pymupdf'))

all_binaries = pillow_heif_binaries + pymupdf_binaries


a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=all_binaries,
    datas=[
        ('static', 'static'),
        ('templates', 'templates'),
    ],
    hiddenimports=[
        # ── FastAPI / Uvicorn / ASGI stack ──
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'uvicorn.lifespan.off',
        'fastapi',
        'fastapi.middleware',
        'fastapi.middleware.cors',
        'starlette',
        'starlette.routing',
        'starlette.requests',
        'starlette.responses',
        'starlette.formparsers',
        'starlette.middleware',
        'starlette.middleware.cors',
        'starlette.middleware.errors',
        'starlette.middleware.exceptions',
        'starlette.staticfiles',
        'starlette.templating',
        'anyio',
        'anyio._backends',
        'anyio._backends._asyncio',
        'h11',
        'multipart',
        'python_multipart',

        # ── HTTP client ──
        'httpx',
        'httpx._transports',
        'httpx._transports.default',
        'httpcore',
        'httpcore._async',
        'httpcore._sync',

        # ── File I/O ──
        'aiofiles',
        'aiofiles.os',
        'aiofiles.ospath',

        # ── Image processing ──
        'PIL',
        'PIL.Image',
        'PIL.JpegImagePlugin',
        'PIL.PngImagePlugin',
        'PIL.WebPImagePlugin',
        'PIL.GifImagePlugin',
        'PIL.BmpImagePlugin',
        'PIL.IcoImagePlugin',
        'PIL.PdfImagePlugin',
        'pillow_heif',
        'pillow_heif.HeifImagePlugin',
        'pillow_heif.as_plugin',
        'pillow_heif.heif',
        'pillow_heif.constants',
        'pillow_heif.misc',
        'pillow_heif.options',
        'pillow_heif._lib_info',
        'pillow_heif._deffered_error',
        '_pillow_heif',

        # ── PDF ──
        'pymupdf',
        'pymupdf._extra',
        'pymupdf._mupdf',

        # ── Google AI ──
        'google.generativeai',
        'google.ai',
        'google.api_core',
        'google.auth',
        'google.protobuf',

        # ── Misc ──
        'cffi',
        '_cffi_backend',
        'zipfile',
        'email.mime',
        'email.mime.multipart',
        'email.mime.text',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # ── Exclude heavy, unnecessary packages to reduce file size ──
        'torch',
        'torchvision',
        'torchaudio',
        'torch_directml',
        'numpy',
        'pandas',
        'scipy',
        'sklearn',
        'matplotlib',
        'pyarrow',
        'numba',
        'llvmlite',
        'tkinter',
        '_tkinter',
        'IPython',
        'jupyter',
        'notebook',
        'pytest',
        'setuptools',
        'pip',
        'wheel',
    ],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='FileForge',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['logo_bgblack.ico'],
)
