export default [
  {
    path: '/usr/bin/sway',
    args: path => [
      'output',
      'LVDS-1',
      'bg',
      path,
      'fill'
    ]
  },
  {
    path: '/usr/bin/gsettings',
    args: path => [
      'set',
      'org.gnome.desktop.background',
      'picture-uri',
      `file://${path}`
    ]
  }
];
