import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getServiceById, getVariantById } from '@/data/services';
import { Calendar, Users, Mail, Phone, User, ArrowLeft, MapPin, Plane } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PayPalButton from '@/components/PayPalButton';

const Checkout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if the ID is a variant ID
  const variantData = getVariantById(id || '');
  const service = variantData?.service || getServiceById(id || '');
  const selectedVariant = variantData?.variant;

  // Use variant price if available, otherwise use service price
  const displayPrice = selectedVariant?.price || service?.price;
  const displayDuration = selectedVariant?.duration || service?.duration;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    persons: '1',
    adultsCount: '1',
    childrenCount: '0',
    message: '',
    startDate: '',
    endDate: '',
    from: '',
    to: '',
    customFrom: '',
    customTo: '',
    flightNumber: '',
    horseLabel: '',
  });

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const calculateTotalPrice = () => {
    if (service?.priceVariants && service.priceVariants.length > 0) {
      const adultPrice = service.priceVariants.find(v => v.label === 'Adult')?.priceNumeric || 0;
      const childPrice = service.priceVariants.find(v => v.label.includes('Child'))?.priceNumeric || 0;

      const adultsCount = parseInt(formData.adultsCount) || 1;
      const childrenCount = parseInt(formData.childrenCount) || 0;

      const total = (adultsCount * adultPrice) + (childrenCount * childPrice);
      return total;
    }
    return null;
  };

  const getTotalPriceDisplay = () => {
    const total = calculateTotalPrice();
    if (total !== null) {
      return `€${total} / ${total * 10}Dhs`;
    }
    return displayPrice;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const isFormValid = useMemo(() => {
    if (!formData.name || !formData.email || !formData.phone) {
      return false;
    }

    if (service?.isRental) {
      return formData.startDate && formData.endDate;
    }

    if (service?.id === 'airport-transfer') {
      return formData.date && formData.from && formData.to &&
        (formData.from !== 'Custom' || formData.customFrom) &&
        (formData.to !== 'Custom' || formData.customTo);
    }

    return formData.date;
  }, [formData, service]);

  const paypalBookingData = useMemo(() => {
    const serviceTitle = selectedVariant ? `${service?.title} - ${selectedVariant.label}` : service?.title || '';
    const totalPrice = calculateTotalPrice();
    const finalPrice = totalPrice !== null ? totalPrice : parseFloat(displayPrice?.replace(/[^0-9.]/g, '') || '0');

    return {
      serviceId: id || '',
      serviceName: serviceTitle,
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      bookingDate: formData.date,
      persons: parseInt(formData.persons) || undefined,
      adultsCount: parseInt(formData.adultsCount) || undefined,
      childrenCount: parseInt(formData.childrenCount) || undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      transferFrom: formData.from === 'Custom' ? formData.customFrom : formData.from,
      transferTo: formData.to === 'Custom' ? formData.customTo : formData.to,
      flightNumber: formData.flightNumber,
      message: formData.message,
      pricePerPerson: selectedVariant?.price ? parseFloat(selectedVariant.price.replace(/[^0-9.]/g, '')) : undefined,
      totalPrice: finalPrice,
    };
  }, [formData, service, selectedVariant, displayPrice, id, calculateTotalPrice]);

  if (!service) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Service Not Found</h1>
          <p className="text-muted-foreground mb-8">The service you're trying to book doesn't exist.</p>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold mb-8">Complete Your Booking</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="pl-10"
                          required
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="pl-10"
                          required
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="pl-10"
                          required
                          placeholder="+212 XXX XXX XXX"
                        />
                      </div>
                    </div>

                    {service?.isRental ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date *</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="startDate"
                                name="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="pl-10"
                                required
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="endDate">End Date *</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="endDate"
                                name="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="pl-10"
                                required
                                min={formData.startDate || new Date().toISOString().split('T')[0]}
                              />
                            </div>
                          </div>
                        </div>
                        {calculateDays() > 0 && (
                          <div className="bg-primary/10 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Total Duration</span>
                              <span className="text-lg font-bold text-primary">{calculateDays()} day{calculateDays() > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : service?.id === 'airport-transfer' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="from">From *</Label>
                            <Select value={formData.from} onValueChange={(value) => setFormData({...formData, from: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select origin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Marrakech">Marrakech</SelectItem>
                                <SelectItem value="Marrakech Airport">Marrakech Airport</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="to">To *</Label>
                            <Select value={formData.to} onValueChange={(value) => setFormData({...formData, to: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select destination" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Marrakech">Marrakech</SelectItem>
                                <SelectItem value="Marrakech Airport">Marrakech Airport</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {formData.from === 'Custom' && (
                          <div className="space-y-2">
                            <Label htmlFor="customFrom">Custom Origin Location *</Label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="customFrom"
                                name="customFrom"
                                value={formData.customFrom}
                                onChange={handleChange}
                                className="pl-10"
                                required
                                placeholder="Enter custom location"
                              />
                            </div>
                          </div>
                        )}

                        {formData.to === 'Custom' && (
                          <div className="space-y-2">
                            <Label htmlFor="customTo">Custom Destination Location *</Label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="customTo"
                                name="customTo"
                                value={formData.customTo}
                                onChange={handleChange}
                                className="pl-10"
                                required
                                placeholder="Enter custom location"
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="date">Transfer Date *</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="date"
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="pl-10"
                                required
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="persons">Number of Persons *</Label>
                            <div className="relative">
                              <Users className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="persons"
                                name="persons"
                                type="number"
                                min="1"
                                max="20"
                                value={formData.persons}
                                onChange={handleChange}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="flightNumber">Flight Number</Label>
                          <div className="relative">
                            <Plane className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="flightNumber"
                              name="flightNumber"
                              value={formData.flightNumber}
                              onChange={handleChange}
                              className="pl-10"
                              placeholder="e.g. AT123"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="horseLabel">Reference/Horse Label</Label>
                          <Input
                            id="horseLabel"
                            name="horseLabel"
                            value={formData.horseLabel}
                            onChange={handleChange}
                            placeholder="For tracking purposes"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="date">Preferred Date *</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="date"
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="pl-10"
                                required
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                          </div>

                          {service?.priceVariants ? (
                            <div className="space-y-2">
                              <Label htmlFor="adultsCount">Number of Adults *</Label>
                              <div className="relative">
                                <Users className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                <Input
                                  id="adultsCount"
                                  name="adultsCount"
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={formData.adultsCount}
                                  onChange={handleChange}
                                  className="pl-10"
                                  required
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label htmlFor="persons">Number of Persons *</Label>
                              <div className="relative">
                                <Users className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                <Input
                                  id="persons"
                                  name="persons"
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={formData.persons}
                                  onChange={handleChange}
                                  className="pl-10"
                                  required
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {service?.priceVariants && (
                          <div className="space-y-2">
                            <Label htmlFor="childrenCount">Number of Children (-7 years)</Label>
                            <div className="relative">
                              <Users className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="childrenCount"
                                name="childrenCount"
                                type="number"
                                min="0"
                                max="20"
                                value={formData.childrenCount}
                                onChange={handleChange}
                                className="pl-10"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="message">Special Requests or Notes</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Any special requests or questions?"
                        rows={4}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <PayPalButton
                        bookingData={paypalBookingData}
                        disabled={!isFormValid}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedVariant ? `${service.title} - ${selectedVariant.label}` : service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedVariant?.description || service.shortDescription}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{displayDuration.split('|')[0].trim()}</span>
                    </div>
                    {displayDuration.includes('Departure') && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Departure</span>
                        <span className="font-medium">{displayDuration.split('Departure at ')[1]}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{service.location}</span>
                    </div>

                    {service?.priceVariants ? (
                      <div className="pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Adults ({formData.adultsCount}) × {service.priceVariants.find(v => v.label === 'Adult')?.price}</span>
                          <span className="font-medium">€{(parseInt(formData.adultsCount) || 1) * (service.priceVariants.find(v => v.label === 'Adult')?.priceNumeric || 0)}</span>
                        </div>
                        {parseInt(formData.childrenCount) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Children ({formData.childrenCount}) × {service.priceVariants.find(v => v.label.includes('Child'))?.price}</span>
                            <span className="font-medium">€{(parseInt(formData.childrenCount) || 0) * (service.priceVariants.find(v => v.label.includes('Child'))?.priceNumeric || 0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-semibold">Total Price</span>
                          <span className="text-2xl font-bold text-primary">{getTotalPriceDisplay()}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center pt-4 border-t">
                        <span className="font-semibold">Price per person</span>
                        <span className="text-2xl font-bold text-primary">{displayPrice}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
