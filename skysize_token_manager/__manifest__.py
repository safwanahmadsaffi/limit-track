{
    'name': 'SkySize Token Manager & Extension Sync',
    'version': '18.0.1.0.0',
    'category': 'Tools',
    'summary': 'Automatic token tracking, extension API sync, and real-time dashboard for SkySize Odoo instances.',
    'description': """
        This module provides automatic token lifecycle management, extension endpoint synchronization, and a real-time dashboard inside Odoo.
    """,
    'author': 'Manus AI',
    'website': 'https://www.skysize.io',
    'depends': ['base', 'web'],
    'data': [
        'security/ir.model.access.csv',
        'views/token_views.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
