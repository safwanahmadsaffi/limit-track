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
