// Placeholder POC template.
// Used only when ENABLE_INFRA=true and deploying to a real Azure subscription.

@description('Prefix for resources')
param prefix string = 'ailab'

@description('Logical lab id')
param labId string

@description('Tier code (starter, explorer, pro)')
param tier string

@description('Owner id')
param owner string

// For now, just a tagging RG-level deployment example.
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' existing = {
  name: '${prefix}-rg'
}

output info object = {
  labId: labId
  tier: tier
  owner: owner
}
