export interface PizzaFlavor {
  id: string
  name: string
  description: string
  type: 'TRADICIONAL' | 'PREMIUM' | 'ESPECIAL'
}

export interface PizzaSize {
  id: string
  name: string
  slices: number
  maxFlavors: number
  basePrice: number
}

export interface Combo {
  id: string
  name: string
  description: string
  price: number
  image?: string
  isActive: boolean
  isPizza: boolean
  category: {
    id: string
    name: string
  }
}

export interface CustomizedItem {
  id: string
  combo: Combo
  quantity: number
  size?: PizzaSize
  selectedSize?: PizzaSize
  flavors?: PizzaFlavor[]
  flavorsPizza2?: PizzaFlavor[]
  extraItems?: { [key: string]: { optionId?: string; quantity: number } }
  observations: string
  stuffedCrust: boolean
  burgerType?: 'artesanal' | 'industrial' // Tipo de hambúrguer selecionado
  totalPrice: number
}
