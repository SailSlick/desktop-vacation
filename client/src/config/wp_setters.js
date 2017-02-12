export default [
  {
    path: '/usr/bin/sway',
    args: path => [
      'output',
      'LVDS-1',
      'bg',
      `'${path}'`,
      'fill'
    ]
  },
  {
    path: '/usr/bin/gsettings',
    args: path => [
      'set',
      'org.gnome.desktop.background',
      'picture-uri',
      `'file://${path}'`
    ]
  },
  {
    path: 'C:/windows/system32/reg.exe',
    args: path => [
      'add',
      '"HKEY_CURRENT_USER\\Control Panel\\Desktop"',
      '/v',
      'Wallpaper',
      '/t',
      'REG_SZ',
      '/d',
      `"${path}"`,
      '/f'
    ]
  },
  {
    path: 'C:/windows/system32/rundll32.exe',
    args: () => [
      'user32.dll,UpdatePerUserSystemParameters'
    ]
  }
];
