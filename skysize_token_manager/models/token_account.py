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
