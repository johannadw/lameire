import axios from "axios";
import Webflow from "webflow-api";
import * as dotenv from "dotenv";
import _ from "lodash";

// import categories from './data/categories.json'
// import purposes from './data/purposes.json'
// import purposeStatuses from './data/purposeStatuses.json'
// import subcategories from './data/subcategories.json'
import categories from './data/categories.json' assert { type: "json" }
import purposes from './data/purposes.json' assert { type: "json" }
import purposeStatuses from './data/purposeStatuses.json' assert { type: "json" }
import subcategories from './data/subcategories.json' assert { type: "json" }

dotenv.config();

const WHISE_BASEURL = 'https://api.whise.eu/'
const WHISE_USER = process.env.WHISE_USER
const WHISE_PASS = process.env.WHISE_PASSWORD
const CLIENTID = 9654;
const OFFICEID = 12121;

var pandNaam
var pandSlug
var pandThumbnail
var pandStatus
var pandPrijs
var pandAdresLine1
var pandAdresLine2
var pandLocatie
var pandAantalBadkamers
var pandAantalSlaapkamers
var pandCategory
var pandSubcategory
var pandCustomCode

// (async () => {


//     return { webflow, site, collection, allItems }
//  })()


async function whiseGetToken() {
  let url = WHISE_BASEURL + 'token';
  let headers = {
      'Content-Type': 'application/json'
  };
  let body = {
      username: WHISE_USER,
      password: WHISE_PASS
  };

  try {
      let resp = await axios.post(url, body,
          {
              headers: headers
          });
      if (resp && resp.data && resp.data.token) {
          return resp.data.token;
      }
  }
  catch (e) {
      console.log(e);
  }
}

async function whiseGetClientToken() {
  let url = WHISE_BASEURL + 'v1/admin/clients/token';
  let headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await whiseGetToken()}`
  };
  let body = {
      ClientId: CLIENTID,
      OfficeId: OFFICEID
  };
  try {
      let resp = await axios.post(url, body,
          {
              headers: headers
          });

      if (resp && resp.data && resp.data.token) {
          return resp.data.token;
      }
  }
  catch (e) {
      console.log(e);
  }
}

async function whiseGetData() {
    let url = WHISE_BASEURL + 'v1/estates/list';
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await whiseGetClientToken()}`
    };
    let body = {
        Page: {
            Limit: 1,
            Offset: 6
        }
    };

    try {
        let resp = await axios.post(url, body,
            {
                headers: headers
            });

        if (resp && resp.data && resp.data.estates) {
            for (let estate of resp.data.estates) {
                if (!estate) {
                    continue;
                }
                pandNaam = estate.name
                pandSlug = estate.id
                pandSlug =  pandSlug.toString()
                pandThumbnail = estate.pictures[0].urlLarge
                pandStatus = getPurpose()
                pandPrijs = estate.price
                pandPrijs = pandPrijs.toString()
                pandAdresLine2 = estate.zip + " " + estate.city + " " + estate.country.id
                pandLocatie = estate.city
                pandAantalBadkamers = getBathrooms()
                pandAantalSlaapkamers = getBedrooms()
                var pandDetails
                pandCategory = getCategory()
                pandSubcategory = getSubcategory()
                // var detailList = []
                if (estate.box) {
                    pandAdresLine1 = estate.address + " " + estate.number + " " + estate.box
                } else {
                    pandAdresLine1 = estate.address + " " + estate.number
                }
                pandCustomCode = {
                    locationLine1: pandAdresLine1,
                    locationLine2: pandAdresLine2,
                    description: estate.shortDescription[0].content,
                    imageCollection: estate.pictures,
                    thumbnailImage: pandThumbnail,
                    askingPrice: pandPrijs,
                    purposeStatus: getPurposeStatus(),
                    transactionType: pandStatus,
                    propertyType: pandCategory,
                    propertySubtype: pandSubcategory,
                }

                pandDetails = estate.details.reduce((pandDetails, detail) => {
                    var group = (pandDetails[detail.group] || [])
                    group.push(detail)
                    pandDetails[detail.group] = group
                    return pandDetails
                }, {})

                function getBathrooms() {
                    if (estate.bathRooms) {
                        pandAantalBadkamers = estate.bathRooms
                    } else {
                        pandAantalBadkamers = 0
                    }
                    return pandAantalBadkamers.toString()
                }
                function getBedrooms() {
                    pandAantalSlaapkamers = 0
                    for (let details in estate.details) {
                        if (estate.details[details].id === 78 || estate.details[details].id === 79 || estate.details[details].id === 80 || estate.details[details].id === 81 || estate.details[details].id === 82) {
                            pandAantalSlaapkamers++
                        }
                    }
                    return pandAantalSlaapkamers.toString()
                }
                function getSubcategory() {
                    let obj = subcategories.find(o => o.id === estate.subCategory.id)
                    return obj.name
                }
                function getPurpose() {
                    let obj = purposes.find(o => o.id === estate.purpose.id)
                    return obj.name
                }
                function getPurposeStatus() {
                    let obj = purposeStatuses.find(o => o.id === estate.purposeStatus.id)
                    return obj.name
                }
                function getCategory() {
                    let obj = categories.find(o => o.id === estate.category.id)
                    return obj.name
                }

                // for (let detail in pandDetails) {
                //     if (!detailList.includes(detail)) {
                //         detailList.push(detail)
                //         const detailObj = pandDetails[detail]
                //         pandCustomCode[detail] = detailObj
                //         for (const detailItem in detailObj) {
                //             //
                //         }
                //     }
                // }

                pandCustomCode = JSON.stringify(pandCustomCode)

                const fields = {
                    name: pandNaam,
                    status: pandStatus,
                    prijs: pandPrijs,
                    thumbnail: pandThumbnail,
                    'adres-line-1': pandAdresLine1,
                    'adres-line-2': pandAdresLine2,
                    'aantal-slaapkamers': pandAantalSlaapkamers,
                    'aantal-badkamers': pandAantalBadkamers,
                    locatie: pandLocatie,
                    'custom-code': pandCustomCode,
                    _archived: false,
                    _draft: false,
                    slug: pandSlug,
                  };

                  return fields
                // return { pandNaam, pandSlug, pandThumbnail, pandStatus, pandPrijs, pandAdresLine1, pandAdresLine2, pandLocatie, pandAantalBadkamers, pandAantalSlaapkamers, pandCategory, pandSubcategory, pandCustomCode }
            }
        }
    }
    catch (e) {
        console.log(e);
    }
};

whiseGetData()
// console.log(whiseFields)


// console.log( fields.thumbnail )

// alert('Whise: ' + fields.name)


const webflow = new Webflow({ token: process.env.WF_API_KEY });

const site = await webflow.site({ siteId: "636134ed842a02654a3bbfe4" });
const { rateLimit } = site._meta;
const collection = await webflow.collection({ collectionId: "6414a4b48fdbc81367c66506" });

const allItems = await collection.items()
const filtered = _.filter(allItems.items, { slug: fields.slug })

  if ( filtered.length === 0 ) {
  const createdItem = await webflow.createItem({
      collectionId: '6414a4b48fdbc81367c66506', fields,
  })
  const publishedItem = await webflow.publishItems({
      collectionId: "6414a4b48fdbc81367c66506", itemIds: [createdItem._id], live: true,
  })
  alert('Created: ')
  } else {
  const updatedItem = await webflow.updateItem({
      collectionId: "6414a4b48fdbc81367c66506", itemId: filtered[0]._id, fields,
  });
  const publishedItem = await webflow.publishItems({
      collectionId: "6414a4b48fdbc81367c66506", itemIds: [updatedItem._id], live: true,
  })
  alert('Updated: ' + updatedItem.thumbnail)
  }

// alert('Hello World')