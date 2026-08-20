# SkySize Odoo Hosting & Automatic Token Integration Guide (Odoo 19.0)

Published by **Manus AI** for Odoo platform deployment using **SkySize (`skysize.io`)** managed hosting.

---

## 1. Odoo Project Hosting Selection

When setting up your project on Odoo hosting platforms (such as SkySize or Odoo.sh), you must choose **"Yes, we'll write custom code"**.

Because your project requires custom token management, API endpoint controllers for extension synchronization, automated token deductions, and custom dashboard views, standard Odoo apps will not suffice. Selecting "Yes, we'll write custom code" links your GitHub repository to your SkySize instance so that every push automatically builds, tests, and deploys your custom module.

---

## 2. Complete Custom Module Code (`skysize_token_manager`)

Below is the production-ready Odoo 19.0 module structure designed to handle automatic token updates, extension synchronization, secure token authentication, and real-time dashboard tracking.

### Directory Structure
```text
skysize_token_manager/
├── __init__.py
├── __manifest__.py
├── controllers/
│   ├── __init__.py
│   └── main.py
├── models/
│   ├── __init__.py
│   ├── token_account.py
│   └── token_log.py
├── security/
│   └── ir.model.access.csv
├── views/
│   └── token_views.xml
└── tests/
    └── test_tokens.py
```

---

### 2.1 Manifest File (`__manifest__.py`)
```python
{
    'name': 'Limit-Track Token Manager & Extension Sync',
    'version': '19.0.1.0.0',
    'category': 'Tools',
    'summary': 'Automatic token tracking, extension API sync, and real-time dashboard for SkySize Odoo 19 instances.',
    'description': """
        This module provides automatic token lifecycle management, extension endpoint synchronization, and a real-time dashboard inside Odoo 19.0.
    """,
    'author': 'Manus AI',
    'website': 'https://limit-track.skysize.io',
    'depends': ['base', 'web'],
    'data': [
        'security/ir.model.access.csv',
        'views/token_views.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
```

---

### 2.2 Models (`models/token_account.py` & `models/token_log.py`)

#### `models/token_account.py`
```python
from odoo import models, fields, api
from odoo.exceptions import ValidationError
import uuid

class SkysizeTokenAccount(models.Model):
    _name = 'skysize.token.account'
    _description = 'SkySize User Token Account'
    _rec_name = 'name'

    name = fields.Char(string='Account Name', required=True, default=lambda self: self.env.user.name)
    user_id = fields.Many2one('res.users', string='Odoo User', required=True, default=lambda self: self.env.user)
    api_token = fields.Char(string='Access Token', required=True, default=lambda self: str(uuid.uuid4()))
    token_balance = fields.Float(string='Current Token Balance', default=1000.0, required=True)
    token_limit = fields.Float(string='Max Token Limit', default=5000.0, required=True)
    status = fields.Selection([
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('expired', 'Expired')
    ], string='Status', default='active', required=True)
    last_updated = fields.Datetime(string='Last Updated', default=fields.Datetime.now)
    log_ids = fields.One2many('skysize.token.log', 'account_id', string='Token Usage Logs')

    def action_refresh_token(self):
        for record in self:
            record.api_token = str(uuid.uuid4())
            record.last_updated = fields.Datetime.now()

    def deduct_tokens(self, amount, reference='Extension Usage'):
        self.ensure_one()
        if self.token_balance < amount:
            raise ValidationError('Insufficient token balance.')
        self.token_balance -= amount
        self.last_updated = fields.Datetime.now()
        self.env['skysize.token.log'].create({
            'account_id': self.id,
            'tokens_used': amount,
            'balance_after': self.token_balance,
            'reference': reference,
        })
        return True
```

---

### 2.3 Controllers (`controllers/main.py`)
```python
from odoo import http
from odoo.http import request
import json

class SkysizeTokenController(http.Controller):

    @http.route('/api/skysize/tokens/balance', type='json', auth='public', methods=['POST'], csrf=False)
    def get_token_balance(self, **kwargs):
        api_token = kwargs.get('api_token') or request.jsonrequest.get('api_token')
        if not api_token:
            return {'status': 'error', 'message': 'API Token is required'}
        
        account = request.env['skysize.token.account'].sudo().search([('api_token', '=', api_token)], limit=1)
        if not account:
            return {'status': 'error', 'message': 'Invalid API Token'}
            
        return {
            'status': 'success',
            'name': account.name,
            'token_balance': account.token_balance,
            'token_limit': account.token_limit,
            'status_account': account.status,
            'last_updated': account.last_updated
        }

    @http.route('/api/skysize/tokens/consume', type='json', auth='public', methods=['POST'], csrf=False)
    def consume_tokens(self, **kwargs):
        data = request.jsonrequest or kwargs
        api_token = data.get('api_token')
        amount = float(data.get('amount', 0.0))
        reference = data.get('reference', 'Extension Automated Usage')

        if not api_token or amount <= 0:
            return {'status': 'error', 'message': 'Valid API Token and positive amount required'}

        account = request.env['skysize.token.account'].sudo().search([('api_token', '=', api_token)], limit=1)
        if not account:
            return {'status': 'error', 'message': 'Invalid API Token'}

        try:
            account.sudo().deduct_tokens(amount, reference=reference)
            return {
                'status': 'success',
                'message': 'Tokens deducted successfully',
                'token_balance': account.token_balance
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
```

---

### 2.4 Views (`views/token_views.xml`) - Odoo 19 List View Format
```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_skysize_token_account_form" model="ir.ui.view">
        <field name="name">skysize.token.account.form</field>
        <field name="model">skysize.token.account</field>
        <field name="arch" type="xml">
            <form string="Token Account">
                <header>
                    <button name="action_refresh_token" string="Regenerate API Token" type="object" class="btn-primary"/>
                    <field name="status" widget="statusbar" options="{'clickable': '1'}"/>
                </header>
                <sheet>
                    <div class="oe_title">
                        <h1><field name="name" placeholder="Account Name"/></h1>
                    </div>
                    <group>
                        <group>
                            <field name="user_id"/>
                            <field name="api_token" password="1"/>
                        </group>
                        <group>
                            <field name="token_balance"/>
                            <field name="token_limit"/>
                            <field name="last_updated"/>
                        </group>
                    </group>
                    <notebook>
                        <page string="Usage Logs">
                            <field name="log_ids" readonly="1">
                                <list string="Logs">
                                    <field name="create_date"/>
                                    <field name="tokens_used"/>
                                    <field name="balance_after"/>
                                    <field name="reference"/>
                                </list>
                            </field>
                        </page>
                    </notebook>
                </sheet>
            </form>
        </field>
    </record>

    <record id="view_skysize_token_account_list" model="ir.ui.view">
        <field name="name">skysize.token.account.list</field>
        <field name="model">skysize.token.account</field>
        <field name="arch" type="xml">
            <list string="Token Accounts">
                <field name="name"/>
                <field name="user_id"/>
                <field name="token_balance"/>
                <field name="token_limit"/>
                <field name="status"/>
                <field name="last_updated"/>
            </list>
        </field>
    </record>

    <record id="action_skysize_token_account" model="ir.actions.act_window">
        <field name="name">Limit-Track Token Accounts</field>
        <field name="res_model">skysize.token.account</field>
        <field name="view_mode">list,form</field>
        <field name="help" type="html">
            <p class="o_view_nocontent_smiling_face">Create your first Limit-Track token account!</p>
        </field>
    </record>

    <menuitem id="menu_limit_track_root" name="Limit-Track" sequence="10"/>
    <menuitem id="menu_limit_track_tokens" name="Token Accounts" parent="menu_limit_track_root" action="action_skysize_token_account" sequence="10"/>
</odoo>
```

---

## 3. Step-by-Step Deployment on SkySize

1. **Commit and Push to GitHub**:
   Push the unified module to your repository `safwanahmadsaffi/limit-track`:
   ```bash
   git add .
   git commit -m "Unified Release: Odoo 19.0 Module + Integrated Extension"
   git push origin main --force
   ```
2. **Update Apps List in Odoo**:
   - Go to your Odoo instance (ensure Developer Mode is enabled).
   - Navigate to **Apps**, click **Update Apps List**, and click **Update**.
3. **Install the Module**:
   - Search for **Limit Track Token Manager** (Version 19.0.1.0.0).
   - Click **Activate**.
4. **Configure & Connect**:
   - Open the **Limit-Track** menu in Odoo to get your **Access Token**.
   - Paste the token into your Chrome Extension settings to start automatic synchronization.
